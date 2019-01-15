const puppeteer = require('puppeteer');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const path = require('path');
const { Image } = require('image-js');

function fetchPropFrom(meta) {
    const m = JSON.parse(meta);
    return {
        top: m.top,
        height: m.height,
    };
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const server = await new Promise((res, rej) => {
        const compiler = webpack(require('./webpack.config.test.js'));
        const server = new WebpackDevServer(compiler, {
            contentBase: __dirname + '/',
            compress: true,
            port: 8080,
        });
        server.listen(8080, 'localhost', res);
        res(server);
    });
    await page.goto('http://localhost:8080');

    page.on('console', (msg) => {
        for (let i = 0; i < msg.args.length; ++i)
            console.log(`${i}: ${msg.args[i]}`);
    });
    const metas = await page.evaluate(() => {
        const contrast = 'source';
        const experimental = 'sprite';
        const experiments = [
            'simple',
            'bg-image',
            'with-color',
            'with-color-outside',
            'with-color-override',
            'bg-size',
            'bg-size-pixel',
            'bg-size-height',
            'bg-size-cover',
            'bg-size-contain',
            'bg-size-override',
            'bg-position',
            'bg-position-outside',
            'bg-position-override',
            'bg-position-and-size',
            'bg-position-and-size-outside',
            'without-image-set',
            'image-set',
            'image-set-fallback',
            'image-set-and-others'];
        console.log(experiments, contrast);
        const metas = experiments.map((exp) => {
            const contrastSelector = `.${contrast}.${exp}`;
            const experimentsSelector = `.${experimental}.${exp}`;
            /* eslint-disable no-undef */
            const source = document.querySelector(contrastSelector);
            const sprite = document.querySelector(experimentsSelector);
            console.log(source, sprite);
            if (!source || !sprite)
                return false;

            return {
                name: exp,
                source: JSON.stringify(source.getBoundingClientRect()),
                sprite: JSON.stringify(sprite.getBoundingClientRect()),
            };
        }).filter(Boolean);
        return metas;
    });

    // normalize meta
    const experimentsList = metas.map((meta) => ({
        name: meta.name,
        source: fetchPropFrom(meta.source),
        sprite: fetchPropFrom(meta.sprite),
    }));

    await page.screenshot({
        path: './666.png',
        fullPage: true,
    });

    const img = await Image.load('./666.png');

    const grey = img.grey();
    grey.save('./gray666.png');
    const { width } = grey;

    const rslt = experimentsList.map((experiment) => {
        const { sprite, source, name } = experiment;
        console.log(sprite, source, name);
        if (source.height === 0 || sprite.height === 0)
            return { code: 999, msg: '元素未渲染', errCSSBlock: name };
        if (sprite.height !== source.height || sprite.top !== source.top)
            return { code: 606, msg: '页面元素未对应', errCSSBlock: name };
        const sourcePart = grey.crop({ x: 0, y: source.top, width: width / 2, height: source.height });
        const spritePart = grey.crop({ x: width / 2, y: sprite.top, width: width / 2, height: sprite.height });
        const leftPartArray = sourcePart.getPixelsArray();
        const rigthPartArray = spritePart.getPixelsArray();
        if (leftPartArray.length !== rigthPartArray.length) {
            return {
                code: -1,
                msg: '图片大小不匹配',
                errCSSBlock: name,
            };
        } else {
            let len = leftPartArray.length - 1;
            while (len-- && Math.abs(leftPartArray[len][0] - rigthPartArray[len][0]) < 10) {}
            console.log(
                len,
                leftPartArray[len],
                rigthPartArray[len]);
            if (len === -1) {
                return {
                    code: 200,
                    msg: '校验成功',
                    CSSBlock: name,
                };
            } else {
                return {
                    code: 996,
                    msg: `校验失败 @ ${len}`,
                    errCSSBlock: name,
                };
            }
        }
    });
    console.log(rslt);
    await new Promise((res) => {
        server.close(res);
    });
    await browser.close();
})();

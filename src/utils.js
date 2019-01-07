'use strict';

const log = false;
module.exports = {
    logger(title) {
        if (!log)
            return;
        console.log(`-----------------${title}-----------------`);
        Array.prototype.slice.call(arguments).slice(1).forEach((ct) => {
            console.log(ct);
        });
        console.log('-----------------------------------------');
    },
    unit2Number(s) {
        const t = /([^a-zA-Z]+)[a-zA-Z]+/.exec(s);
        if (t)
            return Number(t[1]);
        return s;
    },
    str2NumArray(str, w, h) {
        const strArr = str.split(' ');

        const ww = /([^a-zA-Z]+)[a-zA-Z]+/.exec(w);
        if (ww)
            w = Number(ww[1]);

        const hh = /([^a-zA-Z]+)[a-zA-Z]+/.exec(h);
        if (hh)
            h = Number(hh[1]);

        let rslt = strArr.map((s, i) => {
            const p = /([^$]+)%/.exec(s);
            if (p)
                return Number(p[1]) / 100 * (i === 0 ? w : h);

            const t = /([^a-zA-Z]+)[a-zA-Z]+/.exec(s);
            if (t)
                return Number(t[1]);

            return Number(s);
        });
        if (rslt.length === 1)
            rslt = Array(2).fill(rslt[0]);
        return rslt;
    },
};


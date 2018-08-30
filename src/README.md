# 说明
+ backgroundParser: 单行background解析器
+ backgroundBlockParser: cssBlock 中background属性集解析器，生成parsedRule

+ Plugin2 修改imageList结构到cssBlockList
```
cssBlockList{
	'cssRule-hash':{
		parsedRule: backgroundBlockParser生成
		hash: 原css属性字符串生成的哈希码
		divWidth: 容器宽度
		divHeight: 容器高度
		images: cssblock中所有的图片引用
	}
}
```
修改position、size算法
```
r = css设置的size 与 雪碧图中的图片size比例 
background-size = r * 雪碧图的长宽
background-postion = -r* 雪碧图中的图片偏移 + css设置的position 

```
修改imageSet兼容方式为media query，重算雪碧图的size和position

兼容老版本retina写法


# 局限

+ backgroundBlockParser暂不支持多背景图解析（backgroundParser可以解析单行多图）





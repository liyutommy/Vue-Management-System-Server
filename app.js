const Koa = require("koa");
const app = new Koa();
const views = require("koa-views");
const json = require("koa-json");
const onerror = require("koa-onerror");
const bodyparser = require("koa-bodyparser");
// const logger = require('koa-logger')
const log4js = require("./utils/log4js");
const router = require("koa-router")();
const jwt = require("jsonwebtoken");
const utils = require("./utils/utils");
const koajwt = require("koa-jwt")

// const index = require("./routes/index");
const users = require("./routes/users");

// error handler
onerror(app);

// 连接数据库
require("./config/db");

// middlewares
// 解析数据体
app.use(
	bodyparser({
		enableTypes: ["json", "form", "text"],
	})
);

app.use(json());
// app.use(logger());
// 这个加了才能添加静态文件资源
app.use(require("koa-static")(__dirname + "/public"));

app.use(
	views(__dirname + "/views", {
		extension: "pug",
	})
);

// 错误演示 - 因为没有传入ctx
// app.use(() => {
// 	ctx.body = "hello";
// });

// logger
app.use(async (ctx, next) => {
	// const start = new Date()
	// await next()
	// const ms = new Date() - start
	// console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)

	// 演示正确日志输出
	log4js.info(`get params: ${JSON.stringify(ctx.request.query)}`);
	log4js.info(`post params: ${JSON.stringify(ctx.request.body)}`);
	await next();
});

// routes
// app.use(index.routes(), index.allowedMethods());
// app.use(users.routes(), users.allowedMethods());

// 校验token是否有效
// app.use(koajwt({ secret: "liyutommy" }));

// 一级路由前缀
router.prefix("/api");

router.get("/leave/count", (ctx) => {
	const token = ctx.request.headers.authorization.split(" ")[1];
	const payload = jwt.verify(token, "liyutommy");
	ctx.response.body = utils.success(payload);
});

// 注册二级路由
router.use(users.routes(), users.allowedMethods());
// 给app注册路由
app.use(router.routes(), router.allowedMethods());

// error-handling
app.on("error", (err, ctx) => {
	// console.error("server error", err, ctx);
	log4js.error(`${err.stack}`); // 错误输出
});

module.exports = app;

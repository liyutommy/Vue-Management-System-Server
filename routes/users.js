/**
 * 用户管理模块
 */
const router = require("koa-router")();
const UsersModel = require("../models/userSchema");
const utils = require("../utils/utils");
const jwt = require("jsonwebtoken");

// 二级路由前缀
router.prefix("/users");

router.post("/login", async (ctx) => {
	try {
		// 获取请求的payload
		const { userName, userPwd } = ctx.request.body;
		// 获取数据库中的数据
		const res = await UsersModel.findOne({ userName, userPwd });
		// _doc里面才是真正的数据
		const data = res._doc;
		// 生成jwt token, 30s之后过期
		const token = jwt.sign({ data }, "liyutommy", { expiresIn: "1d" });
		// 返回获取的数据
		if (res) {
			// token挂载到data上
			data.token = token;
			ctx.response.body = utils.success(data);
		} else {
			ctx.response.body = utils.fail("账号或密码不正确");
		}
	} catch (error) {
		ctx.response.body = utils.fail(error.msg);
	}
});

module.exports = router;

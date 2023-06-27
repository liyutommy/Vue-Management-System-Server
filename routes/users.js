/**
 * 用户管理模块
 */
const router = require("koa-router")();
const UsersModel = require("../models/userSchema");
const utils = require("../utils/utils");

// 二级路由前缀
router.prefix("/users");

router.post("/login", async (ctx) => {
	try {
		const { userName, userPwd } = ctx.request.body;
		const res = await UsersModel.findOne({ userName, userPwd });
		if (res) {
			ctx.response.body = utils.success(res);
		} else {
			ctx.response.body = utils.fail("账号或密码不正确");
		}
	} catch (error) {
		ctx.response.body = utils.fail(error.msg);
	}
});

module.exports = router;

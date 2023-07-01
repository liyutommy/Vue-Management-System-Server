/**
 * 用户管理模块
 */
const router = require("koa-router")();
const UsersModel = require("../models/userSchema");
const utils = require("../utils/utils");
const jwt = require("jsonwebtoken");

// 二级路由前缀
router.prefix("/users");

// 用户登录
router.post("/login", async (ctx) => {
	try {
		// 获取请求的payload
		const { userName, userPwd } = ctx.request.body;
		// 获取数据库中的数据
		// 参数: 选择对应的表, 选择对应的字段返回
		/**
		 * 返回数据库指定字段，有三种方式
		 * 1. 'userId userName userEmail state role deptId roleList'
		 * 2. {userId:1,_id:0}
		 * 3. select('userId')
		 */
		const res = await UsersModel.findOne(
			{ userName, userPwd },
			"userId userName userEmail state role deptId roleList"
		);
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

// 返回用户列表
router.get("/list", async (ctx) => {
	// 获取请求的数据
	const { userId, userName, state } = ctx.request.query;
	const { page, skipIndex } = utils.pager(ctx.request.query);
	// 生成查询参数对象
	const params = {};
	if (userId) params.userId = userId;
	if (userName) params.userName = userName;
	if (state && state !== "0") params.state = state;
	// 根据条件查询所有用户列表
	try {
		const query = UsersModel.find(params, { _id: 0, userPwd: 0 });
		// skip指定多少documents被跨过, limit是限制最大数量的文件数量
		const list = await query.skip(skipIndex).limit(page.pageSize);
		// 获取总条数
		const total = await UsersModel.countDocuments(params);
		ctx.response.body = utils.success({
			page: { ...page, total },
			list,
		});
	} catch (error) {
		ctx.response.body = utils.fail(`查询异常: ${error.stack}`);
	}
});

module.exports = router;

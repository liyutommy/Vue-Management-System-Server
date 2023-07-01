/**
 * 用户管理模块
 */
const router = require("koa-router")();
const UsersModel = require("../models/userSchema");
const CounterModel = require("../models/counterSchema");
const utils = require("../utils/utils");
const jwt = require("jsonwebtoken");
const md5 = require("md5");

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
		// 忽略id和userPwd字段
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

// 用户删除/批量删除
router.post("/delete", async (ctx) => {
	// 待删除的用户ID数组
	const { userIds } = ctx.request.body;
	try {
		// User.updateMany({ $or: [{ userId: 10001 }, { userId: 10002 }] })
		// 第一个参数: in操作符 - field只要和array中的任意一个value相同，那么该文档就会被检索出来
		// 第二个参数: 更新的内容
		const res = await UsersModel.updateMany(
			{ userId: { $in: userIds } },
			{ state: 2 }
		);
		if (res.modifiedCount) {
			ctx.response.body = utils.success(res, `删除成功${res.modifiedCount}条`);
			return;
		}
		ctx.response.body = utils.fail("删除失败");
	} catch (error) {
		ctx.response.body = utils.fail(`删除异常: ${error.stack}`);
	}
});

// 用户新增/编辑
router.post("/operate", async (ctx) => {
	const {
		userId,
		userName,
		userEmail,
		mobile,
		job,
		state,
		roleList,
		deptId,
		action,
	} = ctx.request.body;
	// 添加用户
	if (action === "add") {
		// 其中一个字段为空, 都返回错误
		if (!userName || !userEmail || !deptId) {
			ctx.response.body = utils.fail("参数错误", utils.CODE.PARAM_ERROR);
			return;
		}

		// userName或者userEmail条件符合都行
		const res = await UsersModel.findOne(
			{ $or: [{ userName }, { userEmail }] },
			"_id userName userEmail"
		);
		// 有结果, 则有重复用户
		if (res) {
			ctx.response.body = utils.fail(
				`重复检测到有重复的用户, 信息如下: ${res.userName} - ${res.userEmail}`
			);
		} else {
			try {
				// $inc使得sequence_value自增长, 第三个参数使得返回新的数据库表
				// 生成一个新的sequence_value
				const doc = await CounterModel.findOneAndUpdate(
					{ _id: "userId" },
					{ $inc: { sequence_value: 1 } },
					{ new: true }
				);
				// 创建一个用户对象
				const user = new UsersModel({
					userId: doc.sequence_value,
					userName,
					userPwd: md5("123456"),
					userEmail,
					mobile,
					role: 1, //默认普通用户
					roleList,
					job,
					state,
					deptId,
				});
				// Saves this document by inserting a new document into the database
				user.save();
				ctx.response.body = utils.success("", "用户创建成功");
			} catch (error) {
				ctx.response.body = utils.fail(error.stack, "用户创建失败");
			}
		}
	} else {
		// 编辑用户
		if (!deptId) {
			// 部门字段为空, 返回错误
			ctx.response.body = utils.fail("部门不能为空", utils.CODE.PARAM_ERROR);
			return;
		}

		try {
			// 通过id查找, 并且修改以下字段
			// await会返回查询到的结果, 不加await返回的是Query对象
			const res = await UsersModel.findOneAndUpdate(
				{ userId },
				{
					mobile,
					job,
					state,
					roleList,
					deptId,
				}
			);
			// data为空字符串
			ctx.response.body = utils.success("", "更新成功");
		} catch (error) {
			ctx.response.body = utils.fail(res, "更新失败");
		}
	}
});

module.exports = router;

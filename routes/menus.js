/**
 * 菜单管理模块
 */

const router = require("koa-router")();
const utils = require("../utils/utils");
const MenusModel = require("../models/menuSchema");

// 二级路由前缀
router.prefix("/menu");

// 递归的获取菜单(自上而下形成树结构)
function getTreeMenu(rootList, id, list) {
	for (let i = 0; i < rootList.length; i++) {
		const item = rootList[i];
		// ObjectId需要转换为String类型
		if (String(item.parentId[item.parentId.length - 1]) === String(id)) {
			// 记录_doc
			list.push(item._doc);
		}
	}
	list.map((item) => {
		item.children = [];
		getTreeMenu(rootList, item._id, item.children);
		if (item.children.length === 0) {
			// 没有children就删除这个属性
			delete item.children;
		} else if (item.children[0].menuType === 2) {
			// 快速区分按钮和菜单, 用于后期做菜单按钮权限控制
			item.action = item.children;
		}
	});
	return list;
}

// 返回菜单列表的接口
router.get("/list", async (ctx) => {
	const { menuName, menuState } = ctx.request.query;
	// 生成查询参数
	const params = {};
	if (menuName) params.menuName = menuName;
	if (menuState) params.menuState = menuState;
	// 查询并返回菜单列表
	const rootList = (await MenusModel.find(params)) || [];
	// 递归获取菜单树结构
	const permissionList = getTreeMenu(rootList, null, []);
	ctx.body = utils.success(permissionList);
});

// 创建/编辑/删除的接口
router.post("/operate", async (ctx) => {
	const { _id, action, ...params } = ctx.request.body;
	let res, info;
	try {
		if (action === "add") {
			// 在数据库中创建一个新的文档 (create = new MenusModel + save)
			res = await MenusModel.create(params);
			info = "创建成功";
		} else if (action === "edit") {
			params.updateTime = new Date();
			//  findByIdAndUpdate(_id, params) = findOneAndUpdate({_id: _id}, params)
			res = await MenusModel.findByIdAndUpdate(_id, params);
			info = "编辑成功";
		} else {
			res = await MenusModel.findByIdAndRemove(_id);
			// 删除parentId为_id的所有document
			await MenusModel.deleteMany({ parentId: { $all: [_id] } });
			info = "删除成功";
		}
		ctx.body = utils.success("", info);
	} catch (error) {
		ctx.body = utils.fail(error.stack);
	}
});

module.exports = router;

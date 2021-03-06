let messageMetaHandler;
let handleChatMeta;
let dispatchMessage;
const { getFriends, updateStatus } = require('../InterActors/UserInterActors');
Promise.resolve()
	.then(() => {
		let { changeChatMeta, handleMessageMeta } = require("../InterActors/ChatInterActors");
		messageMetaHandler = handleMessageMeta;
		handleChatMeta = changeChatMeta;
		dispatchMessage = require("./SocketHandler").dispatchMessage;
	})
let ServerDispatcher = (function() {

	let handleMessage = (userId, { $mode, data }) => {
		let modeMapping = {
			'msgmeta': messageMetaHandler
		}
		modeMapping[$mode] && modeMapping[$mode]({ ...data, userId });
	}

	return {
		handleMessage
	}
})();

let statusHandler = (user_id, status) => {
	let last_online = Date.now();
	getFriends(user_id)
		.then(friends => {
			if (!friends || !friends.length) {
				return;
			}
			let param = {
				$mode: 'status',
				data: {
					_id: user_id,
					status,
					last_online
				}
			}
			dispatchMessage(friends, param);
		})
		.catch(err => {
			console.log(err);
		})
	updateStatus(user_id, status, last_online);
	status === 'online' && handleChatMeta({ isGlobal : true, userId : user_id })
}

module.exports = {
	ServerDispatcher,
	statusHandler
};
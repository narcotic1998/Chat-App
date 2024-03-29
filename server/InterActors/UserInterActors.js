/* This file contains common functions related to user */

const { isValidObjectId } = require('mongoose');
const UserDB = require('../DB/UserDB');
const { genAuthToken } = require('../Dependencies/AuthToken');
const { dispatchMessage } = require('../WebSocket/SocketHandler');
const { uploadFiles, deleteFile, fetchFile } = require('./FileInterActors');

/**
 * 
 * @param {*} userObj 
 * @returns generated user with ID
 */
let saveUser = userObj => {
	return UserDB.insertOne(userObj)
			.then(user => {
				return user
			})
			.catch(err => {
				return Promise.reject(err);
			})
}

// Pass a query to this function to find a unique user based on that query
/**
 * 
 * @param {*} query 
 * @return { userObj || false } - on finding a user or return false
 */
const getUser = (query, requirement = {}) => {
	return UserDB.findOne(query, requirement)
		.then(user => {
			return (user || false); // return User Object on finding a user else returns false
		})
		.catch(err => {
			return Promise.reject(err);
		})
}

let checkIfUserExists = async ({ query : { user_name, email_id } }) => {
	let query = user_name ? 'user_name' : 'email_id';
	let value = user_name || email_id;
	query = [{
		[query]: value // Reg expression to match both lower and uppercases
	}];
	try {
		let user = await getUser(query);
		return {
			data : {
				user_found : !!user
			}
		}
	}
	catch(err) {
		return Promise.reject(err);
	}
}



const getUserByKeys = (query = [], requirement = {}) => {
	return UserDB.findByKeys(query, requirement)
			.then(user => {
				return user;
			})
			.catch(err => {
				return Promise.reject(err);
			})
}

let getCurrentUserProfile = req => {
	return getProfile(req.userId)
			.then(data => {
				if (!data) {
					return {
						status : 400,
						data : "user not found"
					}
				}
				return {
					data,
					cookies : {
						auth_token : genAuthToken(data)
					}
				}
			})
}

let getProfile = (userId, requirements) => {
	let query = [{
		_id: userId
	}]
	// We don't need password and friends from the database
	requirements = requirements || {
		password: 0,
		friends: 0,
		__v: 0
	}
	return getUser(query, requirements)
			.then(data => data)
			.catch(err => Promise.reject(err));
}

let getUserData = req => {
	let { userId : currentUserId, params : { userId } } = req; 
	if (!isValidObjectId(userId)) {
		return Promise.reject({
			status : 400,
			error : {
				code : "u400",
				message : "Invalid user id"
			}
		});
	}
	
	let requirements = {
		friends : 1,
		user_name : 1
	}
	
	return getProfile(userId, requirements)
			.then(data => {
				if (!data) {
					return {
						status : 400,
						data : "user not found"
					}
				}
				return {
					data : {
						user_name : data.user_name,
						is_friend : data.friends.includes(currentUserId)
					}
				};
			})
			.catch(err => {
				console.log(err);
				return Promise.reject(err);
			})
}

/**
 * 
 * @param {*} user_id 
 * @returns Array of user_id that are friends to the particular user
 */

const getFriends = user_id => {
	let query = [
		{
			_id : user_id
		}
	];
	let requirements = { friends : 1, _id : 0 };
	return getUser(query, requirements)
			.then(({ friends }) => {
				return friends;
			})
			.catch(err => {
				console.log(err);
				return Promise.reject();
			})
}

/**
 * 
 * @param {*} query 
 * @param {*} requirement 
 * @return Multiple Users match the query
 */

const fetchUsers = (query, requirement = {}) => {
	return UserDB.findMany(query, requirement)
			.then(data => {
				return data
			})
			.catch(err => {
				return Promise.reject(err);
			})
}

const getUserByIds = (ids = [], requirements) => {
	return UserDB.findById(ids, requirements)
			.then(data => {
				return data
			})
			.catch(err => {
				return Promise.reject(err);
			})
}

/**
 * 
 * @param {*} user_id 
 * @returns Friends basic details
 */

const getFriendsDetails = ({ userId : user_id }) => {
	return getFriends(user_id)
			.then(friends => {
				if (!friends.length) {
					return Promise.resolve(friends);
				}
				let requirement = {
					_id: 1,
					user_name: 1,
					img_url: 1,
					status: 1,
					last_online: 1
				}
				return getUserByIds(friends, requirement)
			})
			.then(data => ({ data }))
			.catch(err => {
				console.log(err);
				return Promise.reject();
			})
}

const updateStatus = (user_id, status, last_online) => {
	let query = [{
		_id : user_id
	}]
	let data = {
		status,
		last_online
	}
	UserDB.updateOne(query, data)
		.catch(err => {
			console.log(err);
		});
}

const deleteCurrentUser = req => {
	return deleteUserById(req.userId)
			.then(() => {
				return {
					status : 200,
					data : {
						code: "300",
						message: 'User Deleted'
					}
				}
			})
			.catch(() => {
				return {
					status : 400,
					error : {
						code: "304",
						message: 'Unable to delete user'
					}
				}
			})
}

const deleteUserById = user_id => {
	let query = [ { _id : user_id } ]
	return UserDB.deleteOne(query)
			.then(data => data)
			.catch(err => Promise.reject(err))
}

const updateProfilePhoto = req => {
	let image = req.files?.image;
	
	if (!image || image.length > 1 || !image.size) {
		return Promise.resolve({
			status : 400,
			error : {
				code : "p400",
				message : image?.length ? 'Must send only one image' : "No images found"
			}
		})
	}
	
	if (!(image.type?.includes('image'))) {
		return Promise.resolve({
			status : 400,
			error : {
				code : 'f400',
				message : 'File type must be an image'
			}
		});
	}
	
	if ((image.size / Math.pow(1024, 2)) > 1) {
		return Promise.resolve({
			status : 400,
			error : {
				code : 's400',
				message : 'File size must be less than 1mb'
			}
		});
	}
	
	return uploadFiles(image)
			.then(fileId => {
				let currentUserId = req.userId;
				let data = { img_url : '/api/user/pic/' + fileId };
				return UserDB.updateOne([{ _id : currentUserId }], data)
						.then(res => {
							dispatchMessage(currentUserId, {
								$mode : "profileupdate",
								data
							});
							
							return Promise.resolve({
								status : 200,
								data
							});
						})
						.catch(err => {
							console.log(err);
							deleteFile(fileId);
							return Promise.reject({
								message : "upload failed"
							})
						});
			})
			.catch((err) => {
				console.log(err);
				return Promise.reject({
					status : 400,
					error : {
						message : "Unable to upload profile pic"
					}
				})
			})
}

const fetchProfilePhoto = req => {
	return fetchFile(req.params.picId);
}

module.exports = Object.freeze({
	saveUser,
	getUser,
	getCurrentUserProfile,
	checkIfUserExists,
	getFriends,
	getUserData,
	getFriendsDetails,
	getUserByKeys,
	fetchUsers,
	updateStatus,
	deleteCurrentUser,
	updateProfilePhoto,
	fetchProfilePhoto
})
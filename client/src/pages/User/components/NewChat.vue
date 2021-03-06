<template>
	<div class="overlay">
		<div 
			class="new-chat"
			v-exit="handleClose"
		>
			<IconComponent 
				type="close"
				:onClick="handleClose"
			/>
			<ChatInvite 
				@close="handleClose"
				:link="joinLink"
				@copy="copyCode"
			/>
			<hr />
			<JoinChat
				:showIdError="showIdError"
				:onJoin="handleChatJoin" 
				@id-change="showIdError = false"
			/>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import ButtonComponent from "@/components/Button/ButtonComponent";
import IconComponent from "@/components/Icon/IconComponent";
import InputComponent from "@/components/Input/InputComponent";
import { isMobileDevice, checkIfObjectId } from "@/utility/utils";
import { USER_NOT_FOUND } from '@/configs/errorcode';
import { ORIGIN } from "@/utility/constants";

export default {
	name : "NewChat",

	data() {
		return {
			showIdError : false
		}
	},

	computed: {
		...mapState('userstore', ['currentUser']),
		
		joinLink() {
			return `${ORIGIN}/user/${this.currentUser.id}/join`;
		}
	},

	methods : {
		handleClose() {
			this.$emit('close')
		},

		copyCode() {
			navigator.clipboard.writeText(this.joinLink)
				.then(() => {
					this.$successBanner('Copied to clipboard');
					this.$emit('close');
				})
				.catch(() => {
					this.$errorBanner('Unable to copy code');
				})
		},

		handleChatJoin(id, btnContainer) {
			if (id === this.currentUser.id || !checkIfObjectId(id)) { // To check if the id is user id or if the id is not a valid ObjectId
				this.showIdError = true;
				return;
			}
			btnContainer.isLoading = true;
			this.$store.dispatch('chatstore/createNewChat', id)
				.then(chat => {
					this.$goTo('Chat', { id : chat._id });
					this.handleClose();
				})
				.catch(code => {
					if (code === USER_NOT_FOUND) {
						this.showIdError = true;
						return;
					}
					this.handleClose();
				})
				.finally(() => {
					btnContainer.isLoading = false;
				})
		},
	},

	components : {
		IconComponent,
		ChatInvite : {
			name : 'ChatInvite',
			template : `<div class="invite-link">
							Send this join link to your friends to connect with You!
							<div 
								class="link"
								@click="$emit('copy')"
							>
								<span v-tip.elips="link">{{ link }}</span>
								<em class="fa fa-clone"></em>
							</div>
						</div>`,
			props : {
				link : {
					type : String,
					required : true
				}
			}
		},
		JoinChat : {
			name : "JoinChat",
			template : `<div class="mT20 mB20">
							<p class="mB20 font18">To connect with other users enter their User Id </p>
							<div class="flexC flexV">
								<input-component
									v-bind="inputProps"
									:showError="showIdError"
								>
								</input-component>
								<button-component 
									class="mT10"
									v-bind="joinBtnProps"
									:isDisabled="isJoinDisabled"
								>
								</button-component>
							</div>
						</div>`,

			props : {
				showIdError : {
					type : Boolean,
					default : false
				},
				onJoin : {
					type : Function,
					default: () => {}
				}
			},

			components : {
				ButtonComponent,
				InputComponent
			},

			data() {
				return {
					joinBtnProps : {
						content : 'Join Chat',
						clickHandler : this.handleJoin,
						isLoading : false
					},
					inputProps : {
						placeHolder : "User ID",
						errorText : 'Invalid user id',
						onInput : this.handleInput,
						hasFocus : !isMobileDevice,
						onEnter : this.handleJoin
					},
					joinId : ''
				}
			},

			computed : {
				isJoinDisabled() {
					return !this.joinId || this.showIdError
				}
			},

			methods : {
				handleInput(value) {
					this.joinId = value;
					this.$emit('id-change');
				},
				handleJoin() {
					if (this.isJoinDisabled) {
						return;
					}
					this.onJoin(this.joinId, this.joinBtnProps)
				}
			}
		}
	}
}
</script>

<style lang="less" scoped>
@import (reference) "../../../styles/common.less";

	/deep/ .input-wrapper {
		width: 80%;
	}
	/deep/ .new-chat {
		.p50;
		padding-bottom: 0px;
		.taC;
		.center;
		.bgW;
		max-width: 500px;
		z-index: 2;
		& .close {
			.posabs;
			right: 10px;
			top: 10px;
		}
		& .invite-link {
			.mB30;
			.font18;
			& .link {
				cursor: copy;
				.flex;
				.justifySB;
				.aiC;
				.mT20;
				.w100;
				height: 50px;
				background-color: #b5b5b585;
				.pLR20;
				& span {
					.font20;
					font-weight: 600;
					letter-spacing: .2px;
					.elips;
					max-width: 95%;
					.mR15;
					color: #202020f5;
				}
				& em {
					line-height: 27px;
					.font25;
					color: #4a4a4a;
				}
			}
		}
		@media (max-width:500px) {
			.p30;
			width: 300px;
			& .close {
				top: 5px;
				right: 5px;
			}
		}
		@media (max-height:450px) {
			height: 75%;
			overflow: scroll;
		}
	}
</style>
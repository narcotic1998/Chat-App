<template>
	<div class="chat-container">
		<ChatList 
			v-if="is600px || !selectedChatId"
		/>
		<ChatWindow 
			v-if="selectedChatId" 
			:is600px="is600px"
			:chatId="selectedChatId" 
		/>
		<ChatBodyViewChat v-else-if="is600px" />
	</div>
</template>

<script>
import ChatList from "./components/ChatList";
import ChatWindow from "./ChatWindow";
import ChatBodyViewChat from '@/pages/Chat/components/ChatBody/ChatBodyViewChat';
import { isMobileDevice } from "@/utility/utils";

export default {
	name : 'ChatBody',

	props : {
		selectedChatId : {
			type : [ String, Number ]
		},

		is600px : {
			type : Boolean,
			default : true
		}
	},

	data() {
		return {
			isMobile : isMobileDevice
		}
	},

	components : {
		ChatList,
		ChatWindow,
		ChatBodyViewChat
	}
}
</script>

<style scoped>
	.chat-container {
		display: flex;
		flex-grow: 1;
		overflow: hidden;
	}
	.chat-enter {
		animation-delay: 0.3s;
		animation: slide-in 0.2s reverse;
	}
</style>
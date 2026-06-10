<template>
  <emailScroll type="archive" ref="scroll"
               :allow-star="true"
               :getEmailList="getList"
               :emailDelete="emailDelete"
               :star-add="starAdd"
               :star-cancel="starCancel"
               :email-archive="emailArchive"
               :email-unarchive="emailUnarchive"
               @jump="jumpContent"
               actionLeft="6px"
               :show-account-icon="false"
  />
</template>

<script setup>
import emailScroll from "@/components/email-scroll/index.vue"
import {emailDelete, archiveList, emailArchive, emailUnarchive} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {useEmailStore} from "@/store/email.js";
import {defineOptions, onMounted, ref} from "vue";
import router from "@/router/index.js";

defineOptions({
  name: 'archive'
})

const scroll = ref({})
const emailStore = useEmailStore();

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'logic'
  emailStore.contentData.showStar = true
  emailStore.contentData.showReply = true
  emailStore.contentData.showArchive = true
  emailStore.contentData.archived = 1
  router.push('/message')
}

function getList(emailId, size) {
  return archiveList(0, 1, emailId, 0, size).then(data => {
    if (data && data.latestEmail) {
      data.latestEmail.reqAccountId = 0;
      data.latestEmail.allReceive = 1;
    }
    return data;
  })
}

onMounted(() => {
  emailStore.archiveScroll = scroll;
})
</script>

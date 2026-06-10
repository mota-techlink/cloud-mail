import http from '@/axios/index.js';

export function emailList(accountId, allReceive, emailId, timeSort, size, type) {
    return http.get('/email/list', {params: {accountId, allReceive, emailId, timeSort, size, type}})
}

export function emailDelete(emailIds) {
    return http.delete('/email/delete?emailIds=' + emailIds)
}

export function emailLatest(emailId, accountId, allReceive) {
    return http.get('/email/latest', {params: {emailId, accountId, allReceive}, noMsg: true, timeout: 35 * 1000})
}

export function emailRead(emailIds) {
    return http.put('/email/read', {emailIds})
}

export function emailSend(form,progress) {
    return http.post('/email/send', form,{
        onUploadProgress: (e) => {
            progress(e)
        },
        noMsg: true
    })
}

export function emailArchive(emailIds) {
    return http.put('/email/archive', {emailIds})
}

export function emailUnarchive(emailIds) {
    return http.put('/email/unarchive', {emailIds})
}

export function archiveList(accountId, allReceive, emailId, timeSort, size) {
    return http.get('/email/archive/list', {params: {accountId, allReceive, emailId, timeSort, size}})
}
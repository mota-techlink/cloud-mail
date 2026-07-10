import {useUserStore} from "@/store/user.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {loginUserInfo} from "@/request/my.js";
import {permsToRouter} from "@/perm/perm.js";
import router from "@/router";
import {websiteConfig} from "@/request/setting.js";
import i18n from "@/i18n/index.js";

function resolveLang(user) {
    // priority: user.lang (server) → localStorage → navigator → 'en'
    if (user && user.lang) return user.lang;
    const localLang = localStorage.getItem('setting');
    if (localLang) {
        try {
            const parsed = JSON.parse(localLang);
            if (parsed.lang) return parsed.lang;
        } catch (e) {}
    }
    const navLang = navigator.language.split('-')[0];
    return navLang === 'zh' ? 'zh' : 'en';
}

function applyLang(lang) {
    const settingStore = useSettingStore();
    settingStore.lang = lang;
    i18n.global.locale.value = lang;
    let setting = {};
    try {
        setting = JSON.parse(localStorage.getItem('setting') || '{}');
    } catch (e) {}
    setting.lang = lang;
    localStorage.setItem('setting', JSON.stringify(setting));
}

export async function init() {
    document.title = '\u200B'

    const settingStore = useSettingStore();
    const userStore = useUserStore();
    const accountStore = useAccountStore();

    const token = localStorage.getItem('token');

    let setting = null;

    if (token) {
        const userPromise = loginUserInfo().catch(e => {
            console.error(e);
            return null;
        });

        const [s, user] = await Promise.all([websiteConfig(), userPromise]);
        setting = s;
        settingStore.settings = setting;
        settingStore.domainList = setting.domainList;
        document.title = setting.title;

        if (user) {
            accountStore.currentAccountId = user.account.accountId;
            accountStore.currentAccount = user.account;
            userStore.user = user;

            const routers = permsToRouter(user.permKeys);
            routers.forEach(routerData => {
                router.addRoute('layout', routerData);
            });
        }

        applyLang(resolveLang(user));

    } else {
        setting = await websiteConfig();
        settingStore.settings = setting;
        settingStore.domainList = setting.domainList;
        document.title = setting.title;

        applyLang(resolveLang(null));
    }
}

/**
 * 游戏界面
 * 游戏逻辑自己实现
 */

import GameCtr from "../../Controller/GameCtr";
import NodePoolManager from "../../Common/NodePoolManager";
import Apron from "./Apron";
import LandPlane from "./LandPlane";
import ViewManager from "../../Common/ViewManager";
import GameData from "../../Common/GameData";
import PlaneFrameMG from "./PlaneFrameMG";
import UpgradeView from "../view/UpgradeView";
import OffLineProfit from "../view/OffLineProfit";
import UnLockView from "../view/UnLockView";
import Guide from "./Guide";
import UserManager from "../../Common/UserManager";
import WXCtr from "../../Controller/WXCtr";
import AudioManager from "../../Common/AudioManager";
import HttpCtr from "../../Controller/HttpCtr";
import Util from "../../Common/Util";


const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {

    @property(cc.Node)
    ndGame: cc.Node = null;
    @property(cc.Node)
    ndLoading: cc.Node = null;
    @property(cc.ProgressBar)
    pgbLoading: cc.ProgressBar = null;
    @property(cc.Node)
    ndDiamonds: cc.Node = null;
    @property(cc.Node)
    ndMoreGame: cc.Node = null;
    @property(cc.Node)
    ndCustom: cc.Node = null;

    @property(cc.Label)
    lbScore: cc.Label = null;
    @property(cc.Node)
    ndPlanePos: cc.Node = null;
    @property(cc.Prefab)
    pfLandPlane: cc.Prefab = null;
    @property(cc.Node)
    ndTrash: cc.Node = null;
    @property(cc.Node)
    ndExtend: cc.Node = null;
    @property(cc.Node)
    ndSignIn: cc.Node = null;
    @property(cc.Sprite)
    sprSlider: cc.Sprite = null;

    @property(cc.Node)
    ndBannerSlider: cc.Node = null;
    @property(cc.Node)
    ndFriendBtn: cc.Node = null;

    @property(cc.Prefab)
    pfUpgrade: cc.Prefab = null;
    @property(cc.Prefab)
    pfOffLineProfit: cc.Prefab = null;
    @property(cc.Prefab)
    pfUnlock: cc.Prefab = null;
    @property(cc.Prefab)
    pfInviteFriend: cc.Prefab = null;
    @property(cc.Prefab)
    pfLoginAward: cc.Prefab = null;
    @property(cc.Prefab)
    pfPlaneUpgrade: cc.Prefab = null;

    private landPlanePool;
    public goldParticlePool;

    public landPlaneArr = [];

    public allPort = [];


    private ufoShowTimes = 0;
    private sliderIdx = 0;

    onLoad() {
        GameCtr.getInstance().setGame(this);
        this.initPools();
        WXCtr.onShow(() => {
            WXCtr.isOnHide = false;
            this.scheduleOnce(() => {
                this.showOffLineProfitPop();
            }, 2.5);
        });
    }

    onDestroy() {
        WXCtr.offShow();
    }

    start() {
        this.gameStart();
    }

    initPools() {
        this.landPlanePool = NodePoolManager.create(this.pfLandPlane);
    }

    gameStart() {
        GameCtr.isStartGame = true;
        WXCtr.getSelfData();
        WXCtr.getFriendRankingData();
        this.showLoading();
    }

    showLoading() {
        // let pgb = this.ndLoading.getChildByName("pgbLoading").getComponent(cc.ProgressBar);
        // pgb.node.active = true;
        // let plane = pgb.node.getChildByName("plane");
        // if (pgb.progress <= 1) {
        //     this.scheduleOnce(() => {
        //         plane.x = pgb.node.width * pgb.progress - (pgb.node.width / 2);
        //         pgb.progress += 0.015;
        //         this.showLoading();
        //     }, 0.02);
        // } else {
        //     this.ndLoading.active = false;

            this.initGame();
            this.refreshGameBtns();
            WXCtr.createBannerAd(100, 300);
        // }
    }

    initGame() {
        this.setDiamonds();
        this.showLandPort();
        this.showMoreGameBtn();
        setInterval(() => {
            if (WXCtr.isOnHide) return;
            GameData.submitGameData();
            WXCtr.createBannerAd(100, 300);
        }, 60000);
    }

    refreshGameBtns() {
        this.ndMoreGame.active = GameCtr.reviewSwitch;
        this.ndFriendBtn.active = GameCtr.reviewSwitch;
        this.showSlider();
        this.showBannerSlider();
    }

    showSignBtn() {
        this.ndSignIn.runAction(cc.repeatForever(cc.sequence(
            cc.scaleTo(0.3, 1.1),
            cc.scaleTo(0.3, 1.0)
        )));
    }

    showMoreGameBtn() {
        this.ndMoreGame.runAction(cc.repeatForever(cc.sequence(
            cc.scaleTo(0.5, 1.1),
            cc.scaleTo(0.5, 1.0)
        )));
    }

    setDiamonds() {
        let lbDiamonds = this.ndDiamonds.getChildByName("lbDiamonds").getComponent(cc.Label);
        lbDiamonds.string = GameData.diamonds + "";
    }

    //增加游戏分数
    addScore(num = 1) {
        GameCtr.addScore(num);
        this.lbScore.string = GameCtr.score + "";
    }

    showLandPort() {
        this.allPort = [];
        for (let i = 1; i <= this.ndPlanePos.childrenCount; i++) {
            let node = this.ndPlanePos.getChildByName(i + "");
            let ndSke = node.getChildByName("banzi")
            ndSke.active = false;
            node.active = true;
            node.tag = i;
            this.allPort.push(node);
        }

        this.setPortPlane();
    }

    setPortPlane() {
        for (let i = 0; i < this.allPort.length; i++) {
            let port = this.allPort[i];
            let level = GameData.getApronState(port.tag);
            if (level > 0) {
                this.setPlaneOnLand(level, port);
            }
        }

        // this.showOffLineProfitPop();
    }

    setPlaneOnLand(level, port) {
        let comp = port.getComponent(Apron);
        if (comp.isUsed) return;
        let plane = this.landPlanePool.get();
        port.addChild(plane);
        plane.position = cc.v2(0, 0);
        this.landPlaneArr.push(plane);
        let landPlane = plane.getComponent(LandPlane);
        landPlane.setLevel(level);
        landPlane.apronTag = port.tag;
        comp.plane = landPlane;
        comp.isUsed = true;
    }

    addBasePlane() {
        for (let i = 0; i < this.allPort.length; i++) {
            let port = this.allPort[i];
            let comp = port.getComponent(Apron);
            if (comp.isUsed) {
                continue;
            } else {
                let plane = this.landPlanePool.get();
                port.addChild(plane);
                plane.position = cc.v2(0, 0);
                let landPlane = plane.getComponent(LandPlane);
                landPlane.setLevel(1);
                landPlane.apronTag = port.tag+10;
                comp.plane = landPlane;
                comp.isUsed = true;
                return;
            }
        }
    }

    showTrash() {
        let trash = this.ndTrash.getChildByName("icon_trash");
        trash.opacity = 255;
    }

    hideTrash() {
        let trash = this.ndTrash.getChildByName("icon_trash");
        trash.opacity = 180;
    }

    //显示合成飞机粒子
    showExpParticle(wPos) {
        let expParticle = this.ndGame.getChildByName("ExpParticle").getComponent(cc.ParticleSystem);
        wPos = this.ndGame.convertToNodeSpaceAR(wPos);
        expParticle.node.position = wPos;
        expParticle.resetSystem();
        expParticle.node.runAction(cc.sequence(
            cc.delayTime(1.0),
            cc.callFunc(() => {
                expParticle.stopSystem();
            })
        ));
    }

    showPortLight(port) {
        let ndSke = port.getChildByName("banzi");
        ndSke.active = true;
        let ske = ndSke.getComponent(sp.Skeleton);
        ske.setAnimation(0, "animation", false);
    }

    startProduce() {

    }

    update (dt) {

    }

    /**
     * 显示飞机升级弹窗
     */
    showPlaneUpgradePop() {
        let nd = cc.instantiate(this.pfPlaneUpgrade);
        ViewManager.show({
            node: nd,
            maskOpacity: 200
        });
    }

    /**
     * 显示商店
     */
    showMall() {
        if (Guide.guideStep <= 7) {
            return;
        }
        HttpCtr.clickStatistics(GameCtr.StatisticType.MALL);                               //商城点击统计
        ViewManager.showMall();
    }

    removeLandPlane(node) {
        let idx = this.landPlaneArr.indexOf(node);
        this.landPlaneArr.splice(idx, 1);
    }


    /**
     * 显示升级弹窗
     */
    showUpgrade(level) {
        let nd = cc.instantiate(this.pfUpgrade);
        let comp = nd.getComponent(UpgradeView);
        ViewManager.showPromptDialog({
            node: nd,
            title: "升级啦",
            closeButton: true,
            transition: false
        });
        comp.setLevel(level);
    }

    /**
     * 显示离线收益弹窗
     */
    showOffLineProfitPop() {
        console.log("离线收益！！！！！！");
        let profit = 0;                                         //
        let lastTime = WXCtr.getStorageData("lastTime");
        let cTime = new Date().getTime();
        let offTime = Math.floor((cTime - lastTime) / 1000);
        let offLineProfit = Math.floor(profit * offTime * Math.pow(0.4, offTime / 28800));
        if (offTime > 2 * 60 && offLineProfit > 0) {
            let nd = cc.instantiate(this.pfOffLineProfit);
            let comp = nd.getComponent(OffLineProfit)
            ViewManager.show({
                node: nd,
                closeOnKeyBack: true,
                transitionShow: false,
                maskOpacity: 200,
                localZOrder: 1001
            });
            comp.setOffLineProfit(offTime, offLineProfit);
            HttpCtr.submitUserData({ data_4: cTime });
            WXCtr.setStorageData("lastTime", cTime);
        } else {
            this.autoShowLoginAward();
        }

    }

    showOffLineProfitParticle() {
        let particle = this.ndGame.getChildByName("OffLineProfitParticle").getComponent(cc.ParticleSystem);
        particle.resetSystem();
        let particle1 = this.ndGame.getChildByName("OffLineProfitParticle1").getComponent(cc.ParticleSystem);
        particle1.resetSystem();
    }

    /**
     * 显示解锁弹窗
     */
    showUnlockPop(level) {
        let nd = cc.instantiate(this.pfUnlock);
        let comp = nd.getComponent(UnLockView);
        ViewManager.showPromptDialog({
            node: nd,
            title: "解锁",
            closeButton: true,
            transition: false
        });
        comp.setData(level);
    }

    /**
     * 显示邀请好友界面
     */
    showInviteFriendPop() {
        if (Guide.guideStep <= 7) {
            return;
        }
        let nd = cc.instantiate(this.pfInviteFriend);
        ViewManager.show({
            node: nd,
            closeOnKeyBack: true,
            transitionShow: false,
            maskOpacity: 200
        });
    }

    /**
     * 更多游戏
     */
    showMoreGame() {
        if (Guide.guideStep <= 7) {
            return;
        }
        if (GameCtr.otherData) {
            WXCtr.gotoOther(GameCtr.otherData);
            HttpCtr.clickStatistics(GameCtr.StatisticType.MORE_GAME, GameCtr.otherData.appid);                               //更多游戏点击统计
        }
    }

    openCustomService() {
        if (Guide.guideStep <= 7) {
            return;
        }
        HttpCtr.clickStatistics(GameCtr.StatisticType.GIFT);                                    //关注礼包点击统计
        WXCtr.customService();
    }

    videoGift() {
        if (Guide.guideStep <= 7) {
            return;
        }

        let btn = this.ndCustom.getComponent(cc.Button);
        btn.interactable = false;
        HttpCtr.clickStatistics(GameCtr.StatisticType.UFO);                               //UFO视频点击统计
        if (WXCtr.videoAd) {
            AudioManager.getInstance().stopAll();
            WXCtr.offCloseVideo();
            WXCtr.showVideoAd();
            WXCtr.onCloseVideo((res) => {
                GameCtr.playBgm();
                this.ndCustom.active = false;
                GameData.diamonds += 60;
                ViewManager.toast("恭喜获得60钻石奖励！");
                this.setDiamonds();
                WXCtr.setStorageData("everydayDiamonds", { day: Util.getCurrTimeYYMMDD() });
            });
        }
    }

    /**
     * 排行榜
     */
    showRanking() {
        if (Guide.guideStep <= 7) {
            return;
        }
        ViewManager.showRanking();
        HttpCtr.clickStatistics(GameCtr.StatisticType.RANKING);                               //排行榜点击统计
    }

    //自动弹出登录奖励
    autoShowLoginAward() {
        let day = Util.getCurrTimeYYMMDD();
        let info = WXCtr.getStorageData("loginAwardData");
        if (!info) {
            this.showLoginAward();
            WXCtr.setStorageData("loginAwardData", { day: Util.getCurrTimeYYMMDD() });
        }
        else if (info.day != day) {
            this.showLoginAward();
            WXCtr.setStorageData("loginAwardData", { day: Util.getCurrTimeYYMMDD() })
        }
    }

    //每日登录奖励
    showLoginAward() {
        if (Guide.guideStep <= 7) {
            return;
        }
        let nd = cc.instantiate(this.pfLoginAward)
        ViewManager.show({
            node: nd,
            name: "loginAward",
            closeOnKeyBack: true,
            transitionShow: false,
            maskOpacity: 200
        });
    }

    extendBtnChecked(toogle: cc.Toggle) {
        if (Guide.guideStep <= 7) {
            return;
        }
        let moveX = -106;
        if (toogle.isChecked) {
            moveX = 106;
        }
        toogle.interactable = false;
        this.ndExtend.runAction(cc.sequence(
            cc.moveBy(0.5, cc.v2(moveX, 0)),
            cc.callFunc(() => {
                toogle.interactable = true;
            })
        ))
    }

    audioChecked(toogle: cc.Toggle) {
        AudioManager.getInstance().musicOn = !toogle.isChecked;
        AudioManager.getInstance().soundOn = !toogle.isChecked;
    }

    showSlider() {
        if (!GameCtr.reviewSwitch || !GameCtr.sliderDatas) return;
        this.sprSlider.node.active = true;
        this.sprSlider.node.stopAllActions();
        this.sprSlider.node.runAction(cc.repeatForever(cc.sequence(
            cc.scaleTo(0.5, 1.2),
            cc.scaleTo(0.5, 1.0)
        )));
        if (this.sliderIdx >= GameCtr.sliderDatas.length) this.sliderIdx = 0;
        let data = GameCtr.sliderDatas[this.sliderIdx];
        Util.loadImg(this.sprSlider, data.img);
        this.scheduleOnce(() => {
            this.sliderIdx++;
            this.showSlider();
        }, 10);
    }

    clickslider() {
        if (Guide.guideStep <= 7) {
            return;
        }
        let data = GameCtr.sliderDatas[this.sliderIdx];
        WXCtr.gotoOther(data);
        HttpCtr.clickStatistics(GameCtr.StatisticType.MORE_GAME, data.appid);
    }

    showBannerSlider() {
        if (!GameCtr.reviewSwitch || !GameCtr.bannerDatas) return;
        this.ndBannerSlider.active = true;
        let content = this.ndBannerSlider.getChildByName("content");
        for (let i = 0; i < content.childrenCount; i++) {
            let nd = content.children[i];
            let spr = nd.getComponent(cc.Sprite);
            Util.loadImg(spr, GameCtr.bannerDatas[i].img);
        }
    }

    clickBannerSlider(event, idx) {
        let data = GameCtr.bannerDatas[idx];
        WXCtr.gotoOther(data);
        HttpCtr.clickStatistics(GameCtr.StatisticType.BANNER_SLIDER, data.appid);                               //今日新游点击统计
    }

    showGiftBtn() {
        let day = Util.getCurrTimeYYMMDD();
        let info = WXCtr.getStorageData("everydayDiamonds");
        if (GameData.maxPlaneLevel >= 7 && GameCtr.surplusVideoTimes > 0) {
            if (info && info.day != day) {
                this.ndCustom.active = GameCtr.reviewSwitch;
            } else if (!info) {
                this.ndCustom.active = GameCtr.reviewSwitch;
            }
        }
    }
}

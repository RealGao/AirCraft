import GameCtr from "../../Controller/GameCtr";
import NodePoolManager from "../../Common/NodePoolManager";
enum Attack{
    UP=1,
    DOWN=-1
}

const {ccclass, property} = cc._decorator;
@ccclass
export default class NewClass extends cc.Component {
    _lifeValue=null;
    _currentLifeValue=null;
    _level=null;
    _bulletHurt=null;
    _deadEft=null;
    _bulletSpeed=3;
    _attackInterval=2;
    _bulletsArr=[];
    _skin=null;
    _lifeBar=null;
    _isEnemy=false;
    _isBoss=false;
    _bubbleHurtPool=null;
    _attackDirection=null;
    _bulletCount=0;

    @property(cc.SpriteFrame)
    enemySkins:cc.SpriteFrame[]=[];

    @property(cc.SpriteFrame)
    bossSkins:cc.SpriteFrame[]=[];

    @property(cc.SpriteFrame)
    selfSkins:cc.SpriteFrame[]=[];
   
    @property(cc.Prefab)
    bullet:cc.Prefab=null;

    @property(cc.Prefab)
    bubbleHurt:cc.Prefab=null;

    @property(cc.Prefab)
    deadEft:cc.Prefab=null;

    onLoad(){
        this._skin=this.node.getComponent(cc.Sprite);
        this._lifeBar=this.node.getChildByName("lifeBar");
        this._lifeBar.active=false;
        this._bubbleHurtPool=new cc.NodePool();
    }

    startAttack(){
        this._attackInterval=this._isBoss?0.5:3
        this.schedule(this.doAttacked, this._attackInterval);
    }

    init(data){
        this._lifeValue=data.lifeValue;
        this._bulletHurt=data.bulletHurt;
        this._currentLifeValue=data.lifeValue;
        this._isEnemy=data.isEnemy;
        this._isBoss=data.isBoss;
        this._level=data.level;
        this._attackDirection=this._isEnemy?Attack.DOWN:Attack.UP;
        this._bulletCount=this._isBoss?10:3;

        this.initBullets();
        this.initBubbleHurt();
        this.initDeadEft();
        this.setSkin();
        if(this._isEnemy){
            this._lifeBar.active=true;
            this._lifeBar.getComponent(cc.ProgressBar).progress=1;
        }

        if(this._isBoss){
            this._lifeBar.y+=100;
        }
    }

    initBullets(){
        for(let i=0;i<this._bulletCount;i++){
            let bullet =cc.instantiate(this.bullet);
            bullet.parent=cc.find("Canvas");
            bullet.active=false;
            bullet.x=this.node.x;
            bullet.y=this.node.y+150;

            bullet.getComponent("Bullet").init({hurt:this._bulletHurt,isEnemy:this._isEnemy,level:this._level,isBoss:this._isBoss})
            this._bulletsArr.push(bullet);
        }
    }

    initBubbleHurt(){
        for(let i=0;i<3;i++){
            let bubbleHurt=cc.instantiate(this.bubbleHurt);
            this._bubbleHurtPool.put(bubbleHurt);
        }
    }

    initDeadEft(){
        this._deadEft=cc.instantiate(this.deadEft);
        this._deadEft.parent=cc.find("Canvas");
        this._deadEft.active=false;
    }

    setSkin(){
        if(this._isBoss){
            this._skin.spriteFrame=this.bossSkins[this._level-1];
            return;
        }
        if(this._isEnemy){
            this._skin.spriteFrame=this.enemySkins[this._level-1];
        }else{
            this._skin.spriteFrame=this.selfSkins[this._level-1];
        }
    }


    getFreeBullet(){
        for(let i =0;i<this._bulletsArr.length;i++){
            if(!this._bulletsArr[i].active){
                return this._bulletsArr[i];
            }
        }
        return null;
    }

    //发送子弹 攻击对方
    doAttacked(){
        let bullet=this.getFreeBullet();
        let targetPosX=this._isBoss?Math.random()*1400-700:0

        if(bullet){
            bullet.stopAllActions();
            bullet.active=true;
            bullet.tag=10086;
            bullet.x=this.node.x;
            bullet.y=this.node.y+150*this._attackDirection;
            bullet.runAction(cc.sequence(
                cc.moveBy(this._bulletSpeed,cc.p(targetPosX,1500*this._attackDirection)),
                cc.callFunc(()=>{
                    bullet.active=false;
                })
            ))
        }
    }

    //承受攻击
    onAttacked(hurt){
        this._currentLifeValue-=hurt;
        if(this._isEnemy){
            this._lifeBar.getComponent(cc.ProgressBar).progress=this._currentLifeValue/this._lifeValue;
            this.showHurt(hurt);
        }
        if(this._currentLifeValue<=0){
            if(this._isBoss){
                GameCtr.getInstance().getFight().doUpLevel();
            }
            GameCtr.getInstance().getFight().removeAir(this.node);
            this.showDeadEft();
        }
    }


    showHurt(hurt){
        let bubbleHurt=null;
        if(this._bubbleHurtPool.size()>0){
            bubbleHurt=this._bubbleHurtPool.get();
            console.log('log---------从对象池中获取bubbleHurt');
        }else{
            bubbleHurt=cc.instantiate(this.bubbleHurt);
            console.log('log---------重新实例化bubbleHurt');
        }
        bubbleHurt.parent=this.node;
        bubbleHurt.active=true;
        bubbleHurt.y=0;
        bubbleHurt.getComponent("BubbleHurt").showHurt(hurt);
        bubbleHurt.stopAllActions();
        bubbleHurt.runAction(cc.sequence(
            cc.moveBy(2,cc.p(0,150)),
            cc.callFunc(()=>{
                bubbleHurt.active=false;
                this._bubbleHurtPool.put(bubbleHurt)
            })
        ))
    }

    showDeadEft(){
        this._deadEft.active=true;
        this._deadEft.x=this.node.x;
        this._deadEft.y=this.node.y;
        this._deadEft.getComponent(cc.Animation).play();
        this.node.destroy();
    }

    //敌人随机移动
    doRandomMove(){
        let randomX=Math.random()*900-450;
        let randomY=600-Math.random()*400;
        let dinstance=cc.pDistance(cc.p(this.node.x,this.node.y),cc.p(randomX,randomY))
        this.node.runAction(cc.sequence(
            cc.moveTo(dinstance/100,cc.p(randomX,randomY)),
            cc.callFunc(()=>{
                this.doRandomMove();
            })
        ))
    }
}

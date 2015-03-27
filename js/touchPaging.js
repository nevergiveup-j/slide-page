/**
 * @Description: jQuery 弹出层 插件
 * @Author: wangjun
 * @Update: 2014-8-13 16:00
 * @version: 1.0
 * @Github URL: https://github.com/nevergiveup-j/HP/tree/master/popup
 */
 
;(function (factory) {
    if (typeof define === "function" && define.amd) {
        // AMD模式
        define([ "Zepto" ], factory);
    } else {
        // 全局模式
        factory(Zepto);
    }
}(function ($) {
    "use strict";

    /**
     * 工具库
     * @type {Object}
     */
    var Util = {
        elementStyle: document.createElement('div').style,
        // 判断浏览器内核类型
        vendor: function() {
            var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
                transform,
                i = 0,
                l = vendors.length;

            for ( ; i < l; i++ ) {
                transform = vendors[i] + 'ransform';
                if ( transform in Util.elementStyle ) {
                    return vendors[i].substr(0, vendors[i].length-1);
                }
            }

            return false;
        },
        // 判断浏览器来适配css属性值
        prefixStyle: function(style) {
            if ( Util.vendor() === false ) return false;
            if ( Util.vendor() === '' ) return style;

            return Util.vendor() + style.charAt(0).toUpperCase() + style.substr(1);
        },
        // 判断是否支持css transform-3d（需要测试下面属性支持）
        hasPerspective: function(){
            var ret = Util.prefixStyle('perspective') in Util.elementStyle;
            if ( ret && 'webkitPerspective' in Util.elementStyle ) {
                Util.injectStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function( node, rule ) {
                    ret = node.offsetLeft === 9 && node.offsetHeight === 3;
                });
            }
            return !!ret;
        },
        translateZ: function(){
            if(Util.hasPerspective){
                return ' translateZ(0)';
            }else{
                return '';
            }
        },
        // 判断属性支持是否
        injectStyles: function( rule, callback, nodes, testnames ) {
            var style, ret, node, docOverflow,
                div = document.createElement('div'),
                body = document.body,
                fakeBody = body || document.createElement('body'),
                mod = 'modernizr';

            if ( parseInt(nodes, 10) ) {
                while ( nodes-- ) {
                    node = document.createElement('div');
                    node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
                    div.appendChild(node);
                    }
            }

            style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
            div.id = mod;
            (body ? div : fakeBody).innerHTML += style;
            fakeBody.appendChild(div);
            if ( !body ) {
                fakeBody.style.background = '';
                fakeBody.style.overflow = 'hidden';
                docOverflow = docElement.style.overflow;
                docElement.style.overflow = 'hidden';
                docElement.appendChild(fakeBody);
            }

            ret = callback(div, rule);
            if ( !body ) {
                fakeBody.parentNode.removeChild(fakeBody);
                docElement.style.overflow = docOverflow;
            } else {
                div.parentNode.removeChild(div);
            }

            return !!ret;
        }
    };



    // 分享默认配置
    var defaults = {
        // 页面当前数
        pageNow       : 0,
        // 下一个index数
        pageNext      : 0,
        // 触摸开始获取的Y
        touchStartY   : 0,
        // 触摸移动的方向
        movePosition  : null,
        // 移动第一次
        moveFirst     : true
    };


    function TouchPaging($this, options) {

        this.$page = $('.m-page');
        this.options = $.extend(true, {}, defaults, options || {});

        this.init();
    }

    /**
     * 初始化
     */
    TouchPaging.prototype.init = function(){
        this.onStart();
    };

    /**
     * 事件开始
     */
    TouchPaging.prototype.onStart = function() {
        this.$page.on('touchstart mousedown', this.touchStart);
        this.$page.on('touchmove mousemove', this.touchMove);
        this.$page.on('touchend mouseup', this.touchEnd);
    };

    /**
     * 事件开始
     */
    TouchPaging.prototype.onStop = function() {
        this.$page.on('touchstart mousedown', this.touchStart);
        this.$page.on('touchmove mousemove', this.touchMove);
        this.$page.on('touchend mouseup', this.touchEnd);
    };

    /**
     * 触摸移动start
     */
    TouchPaging.prototype.touchStart = function(event) {
        var that = this;

        if ( event.type == "touchstart" ) {
            this.options.touchStartY = event.touches[0].pageY;
        } else {
            this.options.touchStartY = event.pageY || event.y;
        }

    };

    /**
     * 触摸移动Move
     */
    TouchPaging.prototype.touchMove = function(event) {
        var moveY;

        if ( event.type == "touchmove" ) {
            moveY = event.touches[0].pageY;
        } else {
            moveY = event.pageY || event.y;
        }

        var node = this.pagePosition();

            this.pageTranslate(node);

    };

    /**
     * 触摸移动end
     */
    TouchPaging.prototype.touchEnd = function() {
        var that = this;

        

    };

    /**
     * 触摸移动判断方向
     */
    TouchPaging.prototype.direction = function(event) {
        var that = this;

        var now, next, node;

        // if ( this.movePosition ) {

        // }

        this.pageNext += 1;

        now = this.$page.eq( this.options.pageNow );
        next = this.$page.eq( this.options.pageNext );
        node = [next, now];

        // move阶段根据方向设置页面的初始化位置--执行一次
        if ( this.options.moveFirst ) {
            initNext(node);
        }

        function initNext(node) {
            var top, y,
                _translateZ = Util.translateZ();

            // 设置下一页的显示和位置
            if ( that.options.movePosition == 'up' ) {
                top = parseInt( $(window).scrollTop() );

                if ( top > 0 ) {
                    y = $(window).height() + top;
                } else {
                    y = $(window).height();
                }

                node[0]
                    .css({
                        'transform': 'translate(0, ' + y + 'px)' + _translateZ
                    })
                    .attr('data-translate', y);
                
                
                node[1].attr('data-translate', 0);
            } else {

            }

        }


        return node;
    };

    /**
     * 触摸移动设置
     */
    TouchPaging.prototype.translate = function(node) {
        var that = this;

        if ( !node ) return;

        var _translateZ = Util.translateZ();
        

        


    };

    /**
     * 切换成功
     */
    TouchPaging.prototype.pageSuccess = function() {
        var that = this;

        
    };


    new TouchPaging();

    var Card = {
        // 分页DOM
        _page           : $('.m-page'),
        // 页面当前数
        _pageNow        : 0,
        // 下一个index数
        _pageNext       : 0,

        // 触摸开始获取的Y
        _touchStartY    : 0,
        // 触摸移动的方向
        _movePosition   : null,
        // 移动第一次
        _moveFirst      : true,
        // 页面切换开始
        pageStart: function() {

            touch.on('body', 'swipeup', function(event) {
                Card._movePosition = 'up';
                Card.touchMove();
            });

            touch.on('body', 'swipedown', function(event) {
                Card._movePosition = 'down';
                Card.touchMove();
            });
        },
        // 页面切换停止
        pageStop: function() {
            touch.off('body', 'swipeup', function(event) {
            });

            touch.off('body', 'swipedown', function(event) {
            });
        },
        // 触摸移动Move
        touchMove: function() {
            var node = this.pagePosition();

            this.pageTranslate(node);
        },
        // 触摸移动判断方向
        pagePosition: function(event) {
            var now, next, node;

            if ( this._movePosition ) {

            }

            this._pageNext += 1;

            now = this._page.eq( this._pageNow );
            next = this._page.eq( this._pageNext );
            node = [next,now];

            // move阶段根据方向设置页面的初始化位置--执行一次
            if ( this._moveFirst ) {
                initNext(node);
            }

            function initNext(node) {
                var _translateZ = Card._translateZ();

            }


            return node;
        },
        // 触摸移动设置
        pageTranslate: function(node) {

            console.log( node[0] );
        },
        init: function() {

            // this.pageStart();
            this.pageStart();

        }
    }

    // Card.init();

}));

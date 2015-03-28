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
    var opts = {
        // 页面当前数
        pageNow       : 0,
        // 下一个index数
        pageNext      : null,
        // 触摸开始获取的Y
        touchStartY   : 0,
        // 触摸移动开始
        moveStart     : true,
        // 触摸移动的方向
        movePosition  : null,
        // 滑动的距离
        touchDeltaY   : 0,
        // 移动第一次
        moveFirst     : true
    };

    function TouchPaging($this, options) {

        this.$page = $('.m-page');
        opts = $.extend(true, {}, opts, options || {});

        opts.pageNumber = this.$page.length;

        console.log( this.$page.size() );

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
        var that = this;

        that.$page.on('touchstart mousedown', function(event) {
            that.touchStart(event);
        });
        that.$page.on('touchmove mousemove', function(event) {
            that.touchMove(event);
        });
        that.$page.on('touchend mouseup', function(event) {
            that.touchEnd(event);
        });
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
        var touchY = 0;

        if ( !opts.moveStart ) {
            return;
        }

        if ( event.type == "touchstart" ) {
            touchY = event.touches[0].pageY;
        } else {
            touchY = event.pageY || event.y;
        }

        opts.touchStartY = touchY;
    };

    /**
     * 触摸移动Move
     */
    TouchPaging.prototype.touchMove = function(event) {
        var moveY;

        if ( !opts.moveStart ) {
            return;
        }

        if ( event.type == "touchmove" ) {
            moveY = event.touches[0].pageY;
        } else {
            moveY = event.pageY || event.y;
        }

        var node = this.direction(event, moveY);

        this.translate(node);

    };

    /**
     * Move触摸移动判断方向
     */
    TouchPaging.prototype.direction = function(event, moveY) {
        var now, next, node,
            $pageNow = this.$page.eq( opts.pageNow);

        if ( moveY != 'undefined' ) {
            opts.touchDeltaY = moveY - opts.touchStartY;
        }

        // 设置移动方向
        if ( moveY - opts.touchStartY > 0 ) {
            opts.movePosition = 'down';
        } else {
            opts.movePosition = 'up';
        }

        //设置下一页面的显示和位置
        if ( opts.touchDeltaY <= 0 ) {
            if ( $pageNow.next('.m-page').length == 0 ) {
                opts.pageNext = 0;
            } else {
                opts.pageNext = opts.pageNow + 1;
            }
        } else {
            if ( $pageNow.prev('.m-page').length == 0 ) {
                return;
            } else {
                opts.pageNext = opts.pageNow - 1;
            }
        }

        now = this.$page.eq( opts.pageNow )[0];
        next = this.$page.eq( opts.pageNext )[0];
        node = [now, next];

        // move阶段根据方向设置页面的初始化位置--执行一次
        if ( opts.moveFirst ) {
            initNext(node, this.$page);
        }

        function initNext(node, $page) {
            var top, y,
                _translateZ = Util.translateZ();

            $page.removeClass('active');
            $(node[0])
                .removeClass('fn-hide');
                //.addClass('active');

            // 显示对应移动的page
            $(node[1])
                .removeClass('fn-hide')
                .addClass('active');


            // 设置下一页的显示和位置
            if ( opts.movePosition == 'up' ) {
                top = parseInt( $(window).scrollTop() );

                if ( top > 0 ) {
                    y = $(window).height() + top;
                } else {
                    y = $(window).height();
                }
            } else {
                y = -Math.max( $(window).height(), $(node[1]).height());
            }

            node[1].style[Util.prefixStyle('transform')] = 'translate(0,' + y + 'px)' + _translateZ;

            $(node[0]).attr('data-translate', 0);
            $(node[1]).attr('data-translate', y);

        }


        return node;
    };

    /**
     * Move触摸移动设置
     */
    TouchPaging.prototype.translate = function(node) {
        var that = this;

        if ( !node ) return;

        var _translateZ = Util.translateZ(),
            touchDeltaY = opts.touchDeltaY,
            scale = 1 - Math.abs( touchDeltaY * 0.2 / $(window).height()),
            nextY, nowY;

        //当前的页面移动
        if ( $(node[0]).attr('data-translate') ) {
            nowY = touchDeltaY + parseInt($(node[0]).attr('data-translate'));
        }

        node[0].style[Util.prefixStyle('transform')] = 'translate(0, ' + nowY + 'px)' + _translateZ + 'scale('+ scale +')';

        //下一页移动
        if ( $(node[1]).attr('data-translate') ) {
            nextY = touchDeltaY + parseInt($(node[1]).attr('data-translate'));
        }

        node[1].style[Util.prefixStyle('transform')] = 'translate(0, ' + nextY + 'px)' + _translateZ;

    };

    /**
     * 触摸移动end
     */
    TouchPaging.prototype.touchEnd = function() {

        if ( !opts.moveStart ) {
            return;
        }

        // 第一页UP阻止
        if ( !opts.pageNext && opts.pageNext != 0 ) {
            return;
        }
        
        opts.moveStart = false;

        var touchDeltaY = Math.abs( opts.touchDeltaY );

        // 添加动画事件
        if ( touchDeltaY > 10 ) {
            this.$page.eq( opts.pageNow )[0].style[Util.prefixStyle('transition')] = 'all .3s';
            this.$page.eq( opts.pageNext )[0].style[Util.prefixStyle('transition')] = 'all .3s';
        }

        // 切换页面，移动坐标大于100切换成功
        if ( touchDeltaY >= 100 ) {
            this.toggleSuccess();
        } else {
            this.toggleFail();
        }

        // 注销控制值
        opts.movePosition = null;
        opts.touchStartY = 0;
    };

    /**
     * 切换成功
     */
    TouchPaging.prototype.toggleSuccess = function() {
        var that = this,
            _translateZ = Util.translateZ();


        // 当前的页面切换
        var nowY = ( opts.touchDeltaY > 0 ) ? $(window).height() / 5 : -$(window).height() / 5,
            scale = 0.1;

        this.$page.eq( opts.pageNow )[0].style[Util.prefixStyle('transform')] = 'translate(0, '+ nowY +'px)' + _translateZ + 'scale('+ scale +')';

        // 下一个页面的移动
        this.$page.eq( opts.pageNext )[0].style[Util.prefixStyle('transform')] = 'translate(0, 0)' + _translateZ;

        // 否为最后一页，显示或者隐藏箭头
        if ( opts.next >= opts.pageNumber - 1 ) {
            $('.fixed-arrow').addClass('fn-hide');
        } else {
            $('.fixed-arrow').removeClass('fn-hide');
        }

        // 删除添加的属性、Class
        setTimeout(function() {

            // 当前页面
            that.$page.eq( opts.pageNow )
                .addClass('fn-hide')
                .removeClass('active')
                .attr('data-translate', '')
                .attr('style','');

            that.$page.eq( opts.pageNext )
                .addClass('active')
                .attr('data-translate', '')
                .attr('style','');

            // 还原默认值
            opts.touchDeltaY = 0;
            opts.moveStart = true;
            opts.pageNow = opts.pageNext;
            opts.pageNext = null;

        }, 300);


    };

    /**
     * 切换失败
     */
    TouchPaging.prototype.toggleFail = function() {
        var that = this,
            _translateZ = Util.translateZ();

        // 当前的页面
        this.$page.eq( opts.pageNow )[0].style[Util.prefixStyle('transform')] = 'translate(0, 0)' + _translateZ + 'scale(1)';

        var nextY;
        if ( opts.movePosition == 'up' ) {
            nextY = $(window).height();
        } else {
            nextY = -$(window).height();
        }

        this.$page.eq( opts.pageNext )[0].style[Util.prefixStyle('transform')] = 'translate(0, '+ nextY +'px)' + _translateZ;

        // 删除添加的属性、Class
        setTimeout(function() {

            // 当前页面
            that.$page.eq( opts.pageNow )
                .addClass('active')
                .attr('data-translate', '')
                .attr('style','');

            that.$page.eq( opts.pageNext )
                .addClass('fn-hide')
                .removeClass('active')
                .attr('data-translate', '')
                .attr('style','');

            // 还原默认值
            opts.touchDeltaY = 0;
            opts.moveStart = true;
            opts.pageNext = null;

        }, 300);
    };


    new TouchPaging();

}));
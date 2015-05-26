/**
 * @Description: jQuery 触屏分页插件
 * @Author: wangjun
 * @Update: 2015-05-26 16:00
 * @version: 1.1
 * @Github URL: https://github.com/nevergiveup-j/touchPaging
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

    var userAgent = navigator.userAgent;

    /**
     * 工具库
     * @type {Object}
     */
    var Util = {
        UC: RegExp("Android").test( userAgent ) && RegExp("UC").test( userAgent ) ? true : false,
        weixin: RegExp("MicroMessenger").test( userAgent ) ? true : false,
        iPhone: RegExp("iPhone").test( userAgent )||RegExp("iPod").test( userAgent )||RegExp("iPad").test( userAgent ) ? true : false,
        android: RegExp("Android").test( userAgent ) ? true : false,
        isPC: function(){
            var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
            var flag = true;

            for (var v = 0; v < Agents.length; v++) {
                if (userAgent.indexOf(Agents[v]) > 0) { flag = false; break; }
            }
            return flag;
        },
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
        },
        //禁止滚动条
        scrollStop      : function(){
            //禁止滚动
            $(window).on('touchmove.scroll',Util.scrollControl);
            $(window).on('scroll.scroll',Util.scrollControl);
        },
        //启动滚动条
        scrollStart     : function(){
            //开启屏幕禁止
            $(window).off('touchmove.scroll');
            $(window).off('scroll.scroll');
        },
        //滚动条控制事件
        scrollControl   : function(e){e.preventDefault();}
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
        // 滑动的距离
        touchDeltaY   : 0,
        // 页面切换效果, default、scale
        switchEffect   : 'default',

        // 页面中是否有滚动条
        isSrcoll       : false,
        // 开始滚动条位置
        startScrollTop : null,
        // 触摸移动的方向
        movePosition   : null,
        movePositionC   : null,
        // 返回第一页
        returnFirst    : false,
        // 第一次切换最后一页
        returnLast     : false,
        moveFirst      : true,
        moveInit       : false,
        // 判断鼠标是否按下
        mouseDown      : false
    };

    function TouchPaging(options) {

        this.$page = $('.m-page');
        this.$pageSrcoll = null;
        opts = $.extend(true, {}, opts, options || {});

        opts.pageNumber = this.$page.length;

        this.init();
    }

    /**
     * 初始化
     */
    TouchPaging.prototype.init = function(){
        // 禁止文版被拖动
        document.body.style.userSelect = 'none';
        document.body.style.mozUserSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        // 判断设备的类型并加上class
        if ( Util.isPC() ) {
            $(document.body).addClass('pc');
        } else {
            $(document.body).addClass('mobile');
        }

        Util.android && $(document.body).addClass('android');
        Util.iPhone && $(document.body).addClass('iphone');

        // 判断是否有3d
        if ( !Util.hasPerspective() ) {
            $(document.body).addClass('no-3d');
        } else {
            $(document.body).addClass('yes-3d');
        }

        // 设置页面高度
        this.$page.height( $(window).height() );
        $('.page-content').css({
            'height' : $(window).height()
        });

        // 设置显示页面值
        if ( opts.pageNow != 0 ) {
            this.$page.addClass('fn-hide');
            this.$page.eq( opts.pageNow )
                .removeClass('fn-hide')
                .addClass('page-active animations');
        }

        // 初始化
        this.lazyIMGStart();
        this.addEvent();
        this.triggerFunction();
    };

    /**
     * 添加事件
     */
    TouchPaging.prototype.addEvent = function() {
        var that = this;
        $(window).on('touchstart mousedown', function(event) {
            that.touchStart(event);
        });
        $(window).on('touchmove mousemove', function(event) {
            that.touchMove(event);
        });
        $(window).on('touchend mouseup', function(event) {
            that.touchEnd(event);
        });
    };

    /**
     * 解除事件
     */
    TouchPaging.prototype.removeEvent = function() {
        $(window).off('touchstart mousedown');
        $(window).off('touchmove mousemove');
        $(window).off('touchend mouseup');
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
            touchY = window.event.touches[0].pageY;
        } else {
            touchY = event.pageY || event.y;
            opts.mouseDown = true;
        }

        opts.touchStartY = touchY;
        opts.moveInit = true;

        // start事件,绑定window $page执行多次
        $(window).trigger('start', [event, opts]);
    };

    /**
     * 触摸移动Move
     */
    TouchPaging.prototype.touchMove = function(event) {
        var moveY;

        event.preventDefault();

        if ( !opts.moveStart || !opts.moveInit ) {
            return;
        }

        if ( event.type == "touchmove" ) {
            moveY = window.event.touches[0].pageY;
        } else {
            if ( opts.mouseDown ) {
                moveY = event.pageY || event.y;
            } else {
                return;
            }

        }

        if ( moveY != 'undefined' ) {
            opts.touchDeltaY = moveY - opts.touchStartY;
        }

        // 设置移动方向
        if ( moveY - opts.touchStartY > 0 ) {
            opts.movePosition = 'down';
        } else {
            opts.movePosition = 'up';
        }

        var node = this.direction(event);

        this.translate(node);

        // move事件,绑定window $page执行多次
        $(window).trigger('move', [event, opts]);
    };

    /**
     * Move触摸移动判断方向
     */
    TouchPaging.prototype.direction = function(event) {
        var now, next, node,
            $pageNow = this.$page.eq( opts.pageNow);

        // 最后一页停止回第一页
        if ( !opts.returnFirst && (opts.pageNow >= opts.pageNumber - 1) && opts.movePosition == 'up' ) {
            return;
        }

        if ( opts.movePosition == 'down' ) {
            $('.fixed-arrow').show();
        }

        if ( opts.movePosition != opts.movePositionC ) {
            opts.movePositionC = opts.movePosition;
            opts.moveFirst = true;
        } else {
            opts.moveFirst = false;
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
                if ( opts.returnLast ) {
                    opts.pageNext = opts.pageNumber - 1;
                } else {
                    return;
                }
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

            $page.removeClass('page-active');
            $(node[0])
                .removeClass('fn-hide');
                //.addClass('page-active');

            // 显示对应移动的page
            $(node[1])
                .removeClass('fn-hide')
                .addClass('page-active');


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
            scale = 1,
            nextY, nowY;

        // 页面切换缩小
        if ( opts.switchEffect == 'scale' ) {
            scale = 1 - Math.abs( touchDeltaY * 0.2 / $(window).height());
        }

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
    TouchPaging.prototype.touchEnd = function(event) {
        opts.moveInit = false;
        opts.mouseDown = false;

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
        opts.movePositionC = null;
        opts.touchStartY = 0;

        // end事件,绑定window $page执行多次
        $(window).trigger('end', [event, opts]);
    };

    /**
     * 切换成功
     */
    TouchPaging.prototype.toggleSuccess = function() {
        var that = this,
            _translateZ = Util.translateZ();

        // 判断是否为最后一页，显示或者隐藏箭头
        if ( !opts.returnFirst && opts.pageNext >= opts.pageNumber - 1 ) {
            $('.fixed-arrow').hide();
        }

        // 当前的页面切换
        var nowY = ( opts.touchDeltaY > 0 ) ? $(window).height() : -$(window).height(),
            scale = 1;

        // 页面切换缩小
        if ( opts.switchEffect == 'scale' ) {
            scale = .1;
            nowY /= 5;
        }

        this.$page.eq( opts.pageNow )[0].style[Util.prefixStyle('transform')] = 'translate(0, '+ nowY +'px)' + _translateZ + 'scale('+ scale +')';

        // 下一个页面的移动
        this.$page.eq( opts.pageNext )[0].style[Util.prefixStyle('transform')] = 'translate(0, 0)' + _translateZ;

        // 判断最后一页让，开启循环切换
        if ( opts.pageNext == 0 && opts.pageNow == opts.pageNumber - 1 ) {
            opts.returnLast = true;
        }

        // 删除添加的属性、Class
        setTimeout(function() {

            // 当前页面
            that.$page.eq( opts.pageNow )
                .addClass('fn-hide')
                .removeClass('page-active')
                .attr('data-translate', '');

            that.$page.eq( opts.pageNow )[0].style[Util.prefixStyle('transform')] = '';
            that.$page.eq( opts.pageNow )[0].style[Util.prefixStyle('transition')] = '';

            // 下一页面
            that.$page.eq( opts.pageNext )
                .addClass('page-active')
                .attr('data-translate', '');

            that.$page.eq( opts.pageNext )[0].style[Util.prefixStyle('transform')] = '';
            that.$page.eq( opts.pageNext )[0].style[Util.prefixStyle('transition')] = '';

            // 还原默认值
            opts.touchDeltaY = 0;
            opts.moveStart = true;
            opts.moveFirst = true;
            opts.pageNow = opts.pageNext;
            opts.pageNext = null;

        }, 300);

        // 成功事件,绑定window $page执行多次
        $(window).trigger('success', opts);

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
                .addClass('page-active')
                .attr('data-translate', '')
                .css({
                    'transform': '',
                    'transition': ''
                });

            that.$page.eq( opts.pageNow )[0].style[Util.prefixStyle('transform')] = '';
            that.$page.eq( opts.pageNow )[0].style[Util.prefixStyle('transition')] = '';

            that.$page.eq( opts.pageNext )
                .addClass('fn-hide')
                .removeClass('page-active')
                .attr('data-translate', '');

            that.$page.eq( opts.pageNext )[0].style[Util.prefixStyle('transform')] = '';
            that.$page.eq( opts.pageNext )[0].style[Util.prefixStyle('transition')] = '';

            // 还原默认值
            opts.touchDeltaY = 0;
            opts.moveStart = true;
            opts.moveFirst = true;
            opts.pageNext = null;

        }, 300);

        // 判断是否为最后一页，显示或者隐藏箭头
        if ( !opts.returnFirst && opts.pageNow >= opts.pageNumber - 1 ) {
            $('.fixed-arrow').hide();
        }

        // 失败事件,绑定window $page执行多次
        $(window).trigger('fail', opts);
    };

    /**
     * 切换失败
     */
    TouchPaging.prototype.nextPage = function() {
        opts.touchDeltaY = 200;
        opts.pageNext = opts.pageNow + 1;

        this.$page.removeClass('page-active');
        this.$page.eq( opts.pageNow )
            .removeClass('fn-hide');

        // 显示对应移动的page
        this.$page.eq( opts.pageNext )
            .removeClass('fn-hide')
            .addClass('page-active');

        this.touchEnd();
    };

    /**
     * 加载延迟图片
     */
    TouchPaging.prototype.lazyIMGStart = function( callback ) {
        var $lazy = $('.lazy-img'),
            len = $lazy.length,
            number = 0,
            tao;

        if ( !len ) {
            return;
        }

        $lazy.each(function(i) {
            var self = $(this),
                src = self.attr('data-src');

            $('<img />')
                .on('load',function(){
                    setImgUrl(self, src);
                })
                .error(function() {
                    setImgUrl(self, src);
                })
                .attr('src', src);

        });


        function setImgUrl(self, src) {
            var position, size, repeat, img;

            // 图片
            if ( self.is('img') ) {
                self.attr('src',src)
            } else {
                position = self.attr('data-position');
                size = self.attr('data-size');
                repeat = self.attr('data-repeat');

                self.css({
                    'background-image'      : 'url('+ src +')',
                    'background-position'   : position,
                    'background-size'       : size,
                    'background-repeat'     : repeat
                })
            }

            number += 1;

            // 百分比
            $('.loading-text').html( parseInt((number / len) * 100)+'%' );

            if ( number >= len ) {
                //回调函数
                callback && callback();

                // loading hide
                $('.popup-loading').hide();
            }
        }

    };

    /**
     * 对象函数事件绑定处理
     * start    touch开始事件
     * move     touch移动事件
     * end      touch结束事件
     * success  成功事件
     * fail     失败事件
     */
    TouchPaging.prototype.triggerFunction = function() {
        var that = this;

        // touch开始事件
        $(window).on('start', function(thisEvent, event, options) {
        });

        // touch移动事件
        $(window).on('move', function(thisEvent, event, options) {
        });

        // touch结束事件
        $(window).on('end', function(thisEvent, event, options) {
        });

        // 页面切换成功事件
        $(window).on('success', function(event, options) {

            that.$page.removeClass('animations');
            that.$page.eq( opts.pageNext ).addClass('animations');

        });

        // 页面切换失败事件
        $(window).on('fail', function(event, options) {
        });
    };

    // 用jQuery插件，解除事件有问题
    //$.fn.TouchPaging = function( options, callback ) {
    //    return this.each(function() {
    //        new TouchPaging( $(this), options, callback );
    //    })
    //};

    // 给外部工具
    window.Util = Util;
    window.TouchPaging = TouchPaging;

    // ADM
    return {
        Util: Util,
        TouchPaging: TouchPaging
    };
}));


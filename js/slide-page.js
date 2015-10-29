/**
 * @Description: H5滑动翻页
 * @Author: wangjun
 * @Update: 2015-10-29 16:00
 * @version: 2.1
 * @Github URL: https://github.com/nevergiveup-j/slide-page
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

    function SlidePage(options) {
        this.init(options);
    }

    /**
     * 初始化
     */
    SlidePage.prototype.init = function(options){
        var that = this;

        // 默认配置
        var opts = {
            // 页面列表
            pages: '.m-page',
            // 加载图片标签
            loadIMG: 'img',
            // 不使用IMG标签，data入口
            loadImgData: [],
            // 页面切换效果, default、scale
            switchEffect: 'default',
            // 最后一页返回第一页
            lastReturnFirst: true,
            // 页面总数
            pageTotal: 0,
            // 页面当前数
            pageNow: 0,
            // 下一个index数
            pageNext: null,
            // 触摸移动的方向
            moveDirection: '',
            // 触摸开始回调
            touchStartCallback: function() {},
            // 触摸移动回调
            touchMoveCallback: function() {},
            // 触摸结束回调
            touchEndCallback: function() {},
            // 页面切换成功
            successCallback: function() {},
            // 页面切换成功
            failCallback: function() {}
        };

        this.opts = $.extend(true, {}, opts, options || {});

        this.$pages = $(this.opts.pages);
        this.opts.pageTotal = this.$pages.length;

        if(!this.opts.pageTotal) {
            return;
        }

        // 禁止文版被拖动
        document.body.style.userSelect = 'none';
        document.body.style.mozUserSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        // 判断是否有3d
        if (!Util.hasPerspective()) {
            $(document.body).addClass('no-3d');
        } else {
            $(document.body).addClass('yes-3d');
        }

        // 屏幕高度
        this.viewHeight = $(window).height();

        // 设置页面高度
        this.$pages.css({
            'height': this.viewHeight
        });

        // 设置显示页面值
        if(this.opts.pageNow != 0) {
            this.$pages.addClass('fn-hide');
            this.$pages.eq( this.opts.pageNow )
                .removeClass('fn-hide')
                .addClass('page-active animations');
        }

        this.$pageNow = null;
        this.$pageNext = null;

        // 触摸开始坐标
        this.startY = 0;
        // 触摸移动距离
        this.currentY = 0;

        this.isTouchMove = false;
        this.moveDirectionInit = false;
        this.isMouseDown = false;
        this.isTouchStart = false;
        this.isClickButton = false;

        // 初始化
        this.loadIMGStart();
        this.addEvent();
    };

    /**
     * 添加事件
     */
    SlidePage.prototype.loadIMGStart = function(callback) {
        var that = this,
            $img = $('img'),
            imgData = this.opts.loadImgData,
            len = 0,
            count = 0,
            link;

        $img.length && $img.each(function(i) {
            link = $(this).attr('src');
            imgData.push(link);
        });

        len = imgData.length;

        for(var i = 0; i < len; i++) {
            link = imgData[i];

            $('<img />')
                .on('load',function(){
                    setImgUrl();
                })
                .error(function() {
                    setImgUrl();
                })
                .attr('src', link);
        }

        function setImgUrl() {
            count += 1;

            // 百分比
            $('.loading-text').html(Math.floor(count / len * 100) + '%');

            if ( count >= len ) {
                //回调函数
                callback && callback();

                // loading hide
                $('.popup-loading').hide();
            }
        }
    };

    /**
     * 添加事件
     */
    SlidePage.prototype.addEvent = function() {
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
    SlidePage.prototype.removeEvent = function() {
        $(window).off('touchstart mousedown');
        $(window).off('touchmove mousemove');
        $(window).off('touchend mouseup');
    };

    /**
     * 触摸移动start
     */
    SlidePage.prototype.touchStart = function(event) {
        var that = this;
        var touchY = 0;

        if ( event.type == "touchstart" ) {
            touchY = window.event.touches[0].pageY;
        } else {
            touchY = event.pageY || event.y;
            this.isMouseDown = true;
        }

        this.startY = touchY;
        this.isTouchStart = true;

        this.opts.touchStartCallback && this.opts.touchStartCallback(event, this.opts);
    };

    /**
     * 触摸移动Move
     */
    SlidePage.prototype.touchMove = function(event) {
        var pageY,
            opts = this.opts;

        event.preventDefault();

        if(!this.isTouchStart) {
            return;
        }

        if (event.type == "touchmove") {
            pageY = window.event.touches[0].pageY;
        } else {
            if(this.isMouseDown) {
                pageY = event.pageY || event.y;
            }else{
                return;
            }
        }

        this.currentY = pageY - this.startY;

        // 设置移动方向,大于0
        if(this.currentY > 0){
            opts.moveDirection = 'down';
        }else{
            opts.moveDirection = 'up';
        }

        // 页面不循环切换，第一页阻止切换最后一页，
        if((!opts.lastReturnFirst && opts.pageNow == 0 && opts.moveDirection == 'down')
            || (!opts.lastReturnFirst && (opts.pageNow >= opts.pageTotal - 1) && opts.moveDirection == 'up')
        ){
            return;
        }

        if(this.currentY > 0) {
            if(opts.pageNow == 0){
                opts.pageNext = opts.pageTotal - 1;
            }else{
                opts.pageNext = opts.pageNow - 1;
            }
        }else{
            if(this.opts.pageNow >= opts.pageTotal - 1){
                opts.pageNext = 0;
            }else{
                opts.pageNext = this.opts.pageNow + 1;
            }
        }

        this.isTouchMove = true;

        this.$pageNow = this.$pages.eq(opts.pageNow);
        this.$pageNext = this.$pages.eq(opts.pageNext);

        // 触屏移动方向，初始执行一次
        if(opts.moveDirection != this.moveDirectionInit){
            this.moveDirectionInit = opts.moveDirection;

            this.setInitNext();
        }

        this.moveTranslate();

        this.opts.touchMoveCallback && this.opts.touchMoveCallback(event, this.opts);
    };

    /**
     * 触摸移动end
     */
    SlidePage.prototype.touchEnd = function(event) {
        var that = this;

        this.isMouseDown = false;
        this.isTouchStart = false;

        if(!this.isTouchMove) {
            return;
        }

        var toggleStatus = 'fail';

        // 切换页面，移动距离大于100切换成功
        if(Math.abs(this.currentY) >= 100) {
            toggleStatus = 'success';
        }

        this.togglePage(toggleStatus);

        this.startY = 0;
        this.currentY = 0;

        this.opts.touchEndCallback && this.opts.touchEndCallback(event, this.opts);
    };

    /**
     * 设置下一页动画初始化
     */
    SlidePage.prototype.setInitNext = function() {
        var top = 0,
            _translateZ = Util.translateZ();

        // 设置下一页的显示和位置
        if ( this.opts.moveDirection == 'up' ) {
            top = this.viewHeight + parseInt($(window).scrollTop(), 10);
        } else {
            top = -Math.max(this.viewHeight, this.$pageNext.height());
        }

        this.$pages.removeClass('page-active');

        this.$pageNow.attr('data-translate', 0);
        this.$pageNext
            .removeClass('fn-hide')
            .addClass('page-active')
            .attr('data-translate', top);

        this.$pageNext[0].style[Util.prefixStyle('transform')] = 'translate(0, ' + top + 'px)' + _translateZ;
    };

    /**
     * move平移
     */
    SlidePage.prototype.moveTranslate = function() {
        var _translateZ = Util.translateZ(),
            scale = 1;

        // 页面切换缩小
        if ( this.opts.switchEffect == 'scale' ) {
            scale = 1 - Math.abs(this.currentY * 0.2 / this.viewHeight);
        }

        var nowY = this.currentY + parseInt(this.$pageNow.attr('data-translate'), 10),
            nextY = this.currentY + parseInt(this.$pageNext.attr('data-translate'));

        this.$pageNow[0].style[Util.prefixStyle('transform')] = 'translate(0, ' + nowY + 'px)' + _translateZ + 'scale('+ scale +')';
        this.$pageNext[0].style[Util.prefixStyle('transform')] = 'translate(0, ' + nextY + 'px)' + _translateZ;
    };

    /**
     * 切换页面
     */
    SlidePage.prototype.togglePage = function(status) {
        var that = this,
            _translateZ = Util.translateZ(),
            toggleStatus = 'success',
            scale = 1,
            nowY, nextY;

        // 切换成功
        if(status == toggleStatus){
            nowY = (this.currentY > 0) ? this.viewHeight : -this.viewHeight;
            nextY = 0;
        }else{
            nowY = 0;
            nextY = (this.opts.moveDirection == 'up') ? this.viewHeight : -this.viewHeight;
        }

        this.$pageNow = this.$pages.eq(this.opts.pageNow);
        this.$pageNext = this.$pages.eq(this.opts.pageNext);

        // 添加动画事件
        this.$pageNow[0].style[Util.prefixStyle('transition')] = 'all .3s';
        this.$pageNext[0].style[Util.prefixStyle('transition')] = 'all .3s';

        this.$pageNow[0].style[Util.prefixStyle('transform')] = 'translate(0, ' + nowY + 'px)' + _translateZ + 'scale('+ scale +')';
        this.$pageNext[0].style[Util.prefixStyle('transform')] = 'translate(0, ' + nextY + 'px)' + _translateZ;

        // 删除添加的属性、Class
        setTimeout(function() {
            that.$pages.addClass('fn-hide');

            if(status == toggleStatus) {
                that.$pageNow
                    .removeClass('page-active')
                    .attr('data-translate', '');

                that.$pageNext
                    .removeClass('fn-hide')
                    .attr('data-translate', '');

                that.opts.pageNow = that.opts.pageNext;

                // 判断是否为最后一页，显示或者隐藏箭头
                if(!that.opts.lastReturnFirst && (that.opts.pageNow >= that.opts.pageTotal - 1)){
                    $('.fixed-arrow').addClass('fn-hide');
                }else{
                    $('.fixed-arrow').removeClass('fn-hide');
                }

                that.opts.successCallback && that.opts.successCallback(that.opts);
            }else{
                that.$pageNow
                    .removeClass('fn-hide')
                    .attr('data-translate', '');

                that.$pageNext
                    .removeClass('page-active')
                    .attr('data-translate', '');

                that.opts.failCallback && that.opts.failCallback(that.opts);
            }

            that.$pageNow[0].style[Util.prefixStyle('transition')] = '';
            that.$pageNow[0].style[Util.prefixStyle('transform')] = '';
            that.$pageNext[0].style[Util.prefixStyle('transition')] = '';
            that.$pageNext[0].style[Util.prefixStyle('transform')] = '';

            that.isTouchMove = false;
            that.isClickButton = false;
            that.moveDirectionInit = false;
            that.opts.pageNext = null;

        }, 300);
    };

    /**
     * 上一页
     */
    SlidePage.prototype.prevPage = function() {
        var that = this,
            isEndPage = (this.opts.pageNow == 0);

        if(this.isClickButton || (!this.opts.lastReturnFirst && isEndPage)){
            return;
        }

        this.opts.moveDirection = 'down';
        this.isClickButton = true;
        this.currentY = 100;

        if(isEndPage){
            this.opts.pageNext = this.opts.pageTotal - 1;
        }else{
            this.opts.pageNext = this.opts.pageNow - 1;
        }

        this.$pageNow = this.$pages.eq(this.opts.pageNow);
        this.$pageNext = this.$pages.eq(this.opts.pageNext);

        this.setInitNext();

        setTimeout(function(){
            that.togglePage('success');
            that.currentY = 0;
        }, 100)
    };


    /**
     * 下一页
     */
    SlidePage.prototype.nextPage = function() {
        var that = this,
            isEndPage = (this.opts.pageNow >= this.opts.pageTotal - 1);

        if(this.isClickButton || (!this.opts.lastReturnFirst && isEndPage)){
            return;
        }

        this.opts.moveDirection = 'up';
        this.isClickButton = true;

        if(isEndPage){
            this.opts.pageNext = 0;
        }else{
            this.opts.pageNext = this.opts.pageNow + 1;
        }

        this.$pageNow = this.$pages.eq(this.opts.pageNow);
        this.$pageNext = this.$pages.eq(this.opts.pageNext);

        this.setInitNext();

        setTimeout(function(){
            that.togglePage('success');
        }, 100)
    };

    // 给外部工具
    window.Util = Util;
    window.SlidePage = SlidePage;

    // ADM
    return {
        Util: Util,
        SlidePage: SlidePage
    };
}));


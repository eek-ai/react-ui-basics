import React from 'react';
import ReactCreateElement from './ReactCreateElement';
import PropTypes from 'prop-types';
import './Scrollable.css'
import {classNames, preventDefault, WINDOW, addEventListener, removeEventListener, setTimeout, clearTimeout, setInterval, clearInterval, createRef, orNoop, NOOP} from "./Tools";
import {propsGetter, stateGS, PureComponent, render, componentDidMount, componentDidUpdate, componentWillUnmount} from "./ReactConstants";

export const SCROLLBAR_MODE_HIDDEN = 'hidden';
export const SCROLLBAR_MODE_VISIBLE = 'visible';
export const SCROLLBAR_MODE_AUTO = 'auto';

let NATIVE_SCROLL_WIDTH = -1;
let NATIVE_SCROLL_HEIGHT = -1;

const WITHOUT_SCROLL = 'without-scroll';
const WITH_SCROLL = 'with-scroll';

const createFieldGetter = field => el => el[field];
const scrollHeightOf = createFieldGetter('scrollHeight');
const scrollWidthOf = createFieldGetter('scrollWidth');
const offsetHeightOf = createFieldGetter('offsetHeight');
const offsetWidthOf = createFieldGetter('offsetWidth');
const styleOf = createFieldGetter('style');
const scrollBarModeOf = createFieldGetter('scrollBarMode');
const horizontalScrollBarModeOf = createFieldGetter('horizontalScrollBarMode');

class Scrollable extends PureComponent {

    constructor(properties) {
        super(properties);
        const that = this;
        that.state = {};

        const props = propsGetter(that);
        const status = stateGS(that);
        const statusH = stateGS(that);

        const containerRef = createRef();
        const viewportRef = createRef();
        const scrollbarRef = createRef();
        const horizontalScrollbarRef = createRef();
        const thumbRef = createRef();
        const horizontalThumbRef = createRef();

        let resizeInterval;
        let initTimeout;

        const clear = () => {
            clearInterval(resizeInterval);
            clearTimeout(initTimeout);
        };

        const init = () => {
            clear();

            if (scrollBarModeOf(props()) === SCROLLBAR_MODE_HIDDEN && horizontalScrollBarModeOf(props()) === SCROLLBAR_MODE_HIDDEN) {
                status(WITHOUT_SCROLL);
                statusH(WITHOUT_SCROLL);
                return;
            }

            const viewport = viewportRef();
            const scrollbar = scrollbarRef();
            const scrollbarH = horizontalScrollbarRef();
            const container = containerRef();
            const thumb = thumbRef();
            const thumbH = horizontalThumbRef();

            let scrolling = false;
            let scrolledToBottom = false;
            let scrolledToTop = false;
            let adjustedScrollWidth = false;
            let lastY = 0;
            let lastX = 0;
            let ratio = 0;
            let ratioH = 0;

            viewport.onscroll = (e) => {
                const scrollHeight = scrollHeightOf(viewport);
                const offsetHeight = offsetHeightOf(viewport);
                const scrollWidth = scrollWidthOf(viewport);
                const offsetWidth = offsetWidthOf(viewport);
                const scrollbarHeight = offsetHeightOf(scrollbar);
                const scrollbarWidth = offsetWidthOf(scrollbarH);
                let position = viewport.scrollTop / (scrollHeight - offsetHeight);
                const positionH = viewport.scrollLeft / (scrollWidth - offsetWidth);

                if (position > 1) {
                    viewport.scrollTop = scrollHeight - offsetHeight;
                    position = 1
                }

                styleOf(thumb).top = (position * (scrollbarHeight - offsetHeightOf(thumb))) + 'px';
                styleOf(thumbH).left = (positionH * (scrollbarWidth - offsetWidthOf(thumbH))) + 'px';

                if (position >= 0.98) {
                    !scrolledToBottom && orNoop(props().onScrolledToBottom)();
                    scrolledToBottom = true;
                } else {
                    scrolledToBottom = false;
                }

                if (position <= 0.02) {
                    !scrolledToTop && orNoop(props().onScrolledToTop)();
                    scrolledToTop = true;
                } else {
                    scrolledToTop = false;
                }
            };
            const reset = () => {
                removeEventListener(WINDOW, 'mouseup', reset);
                removeEventListener(WINDOW, 'mousemove', moveListener);
                viewport.style.scrollBehavior = ''
                scrolling = false;
            };
            const moveListener = (e) => {
                if (!scrolling)
                    return;

                if (e.buttons === 0) {
                    reset();
                }

                if (scrolling === 'v') {
                    viewport.scrollTop += (e.clientY - lastY) * ratio;
                    lastY = e.clientY;
                } else if (scrolling === 'h') {
                    viewport.scrollLeft += (e.clientX - lastX) * ratioH;
                    lastX = e.clientX;
                }
            };
            thumb.onmousedown = (e) => {
                lastY = e.clientY;
                scrolling = 'v';
                ratio = scrollHeightOf(viewport) / offsetHeightOf(viewport);
                viewport.style.scrollBehavior = 'unset'

                addEventListener(WINDOW, 'mouseup', reset);
                addEventListener(WINDOW, 'mousemove', moveListener);
            };
            thumb.ondragstart = preventDefault;
            thumb.onmouseup = reset;

            thumbH.onmousedown = (e) => {
                lastX = e.clientX;
                scrolling = 'h';
                ratioH = scrollWidthOf(viewport) / offsetWidthOf(viewport);
                viewport.style.scrollBehavior = 'unset'

                addEventListener(WINDOW, 'mouseup', reset);
                addEventListener(WINDOW, 'mousemove', moveListener);
            };
            thumbH.ondragstart = preventDefault;
            thumbH.onmouseup = reset;

            scrollbar.onclick = (e) => {
                if (e.target === scrollbar) {
                    let thumbPosition = parseInt(styleOf(thumb).top);
                    viewport.scrollTop += offsetHeightOf(viewport) * 0.9 * (e.offsetY < thumbPosition ? -1 : 1);
                }
            };
            scrollbarH.onclick = (e) => {
                if (e.target === scrollbarH) {
                    let thumbPosition = parseInt(styleOf(thumbH).left);
                    viewport.scrollLeft += offsetWidthOf(viewport) * 0.9 * (e.offsetX < thumbPosition ? -1 : 1);
                }
            };

            const adjustScrollWidth = () => {
                if (NATIVE_SCROLL_WIDTH < 0) {
                    NATIVE_SCROLL_WIDTH = viewport.offsetWidth - viewport.clientWidth;
                    if (NATIVE_SCROLL_WIDTH === 0 && scrollHeightOf(viewport) !== offsetHeightOf(viewport)) {
                        NATIVE_SCROLL_WIDTH = -1;
                    }
                }
                if (NATIVE_SCROLL_HEIGHT < 0) {
                    NATIVE_SCROLL_HEIGHT = viewport.offsetHeight - viewport.clientHeight;
                    if (NATIVE_SCROLL_HEIGHT === 0 && scrollWidthOf(viewport) !== offsetWidthOf(viewport)) {
                        NATIVE_SCROLL_HEIGHT = -1;
                    }
                }

                if (!adjustedScrollWidth) {
                    if (NATIVE_SCROLL_WIDTH >= 0 && status() !== WITHOUT_SCROLL) {
                        styleOf(viewport).paddingRight = (NATIVE_SCROLL_WIDTH) + scrollbar.clientWidth + 'px';
                        styleOf(viewport).marginRight = -(NATIVE_SCROLL_WIDTH) - scrollbar.clientWidth + 'px';
                    }
                    if (NATIVE_SCROLL_HEIGHT >= 0 && statusH() !== WITHOUT_SCROLL) {
                        styleOf(viewport).paddingBottom = (NATIVE_SCROLL_HEIGHT) + scrollbarH.clientHeight + 'px';
                        styleOf(viewport).marginBottom = -(NATIVE_SCROLL_HEIGHT) - scrollbarH.clientHeight + 'px';
                    }
                    adjustedScrollWidth = true;
                }
            };

            adjustScrollWidth();

            const showScrollbar = (scrollbar, viewport, adjustScrollWidth) => {
                styleOf(scrollbar).visibility = 'inherit';
                styleOf(scrollbar).bottom = '0'; //enable scrollbar
                styleOf(viewport).overflowY = '';
                adjustScrollWidth();
                status() !== WITH_SCROLL && status(WITH_SCROLL);
            };

            const hideScrollbar = (scrollbar, viewport) => {
                styleOf(scrollbar).visibility = 'hidden'; //disable scrollbar
                styleOf(viewport).overflowY = 'inherit';
                styleOf(viewport).paddingRight = '0';
                styleOf(viewport).marginRight = '0';
                status() !== WITHOUT_SCROLL && status(WITHOUT_SCROLL);
            };

            const showHorizontalScrollbar = (scrollbar, viewport, adjustScrollWidth) => {
                styleOf(scrollbar).visibility = 'inherit';
                styleOf(scrollbar).right = '0'; //enable scrollbar
                styleOf(viewport).overflowX = '';
                adjustScrollWidth();
                statusH() !== WITH_SCROLL && statusH(WITH_SCROLL);
            };

            const hideHorizontalScrollbar = (scrollbar, viewport) => {
                styleOf(scrollbar).visibility = 'hidden'; //disable scrollbar
                styleOf(viewport).overflowX = 'inherit';
                styleOf(viewport).paddingBottom = '0';
                styleOf(viewport).marginBottom = '0';
                statusH() !== WITHOUT_SCROLL && statusH(WITHOUT_SCROLL);
            };

            const updateVerticalScrollbar = () => {
                const scrollHeight = scrollHeightOf(viewport);
                const scrollbarHeight = offsetHeightOf(scrollbar);

                !adjustedScrollWidth && adjustScrollWidth();

                const newRatio = scrollHeight / scrollbarHeight;
                if ((ratio === newRatio && Number.isFinite(newRatio)) || Number.isNaN(newRatio)) return;

                const offsetHeight = offsetHeightOf(viewport);
                const horizontalScrollBarOffset = statusH() !== WITHOUT_SCROLL ? scrollbarH.clientHeight + Math.max(NATIVE_SCROLL_HEIGHT, 0) : 0;

                let containerOffsetHeight = offsetHeightOf(container) + horizontalScrollBarOffset;
                if (containerOffsetHeight === scrollHeight && status() === WITHOUT_SCROLL)
                    return;

                if (props().autoScrollTop && scrollHeight - offsetHeight - viewport.scrollTop <= 20 && newRatio < ratio && Number.isFinite(newRatio) && Number.isFinite(ratio)) {
                    viewport.scrollTop = 0; // scroll to top if scrollbar gets smaller
                }

                ratio = newRatio;
                styleOf(thumb).height = (scrollbarHeight / newRatio) + 'px';

                styleOf(container).height = scrollHeight - horizontalScrollBarOffset + 'px';
                containerOffsetHeight = offsetHeightOf(container) + horizontalScrollBarOffset;

                if (scrollBarModeOf(props()) === SCROLLBAR_MODE_HIDDEN) {
                    if (status() !== WITHOUT_SCROLL)
                        hideScrollbar(scrollbar, viewport);

                    return
                }

                if (containerOffsetHeight < scrollHeight) {
                    adjustedScrollWidth = false;
                    showScrollbar(scrollbar, viewport, adjustScrollWidth);
                } else {
                    hideScrollbar(scrollbar, viewport);
                }

                scrolledToBottom = false;
                scrolledToTop = false;

                const position = viewport.scrollTop / (scrollHeight - offsetHeight);
                styleOf(thumb).top = (position * (scrollbarHeight - offsetHeightOf(thumb))) + 'px';
            };

            const updateHorizontalScrollbar = () => {

                const scrollWidth = scrollWidthOf(viewport);
                const scrollbarWidth = offsetWidthOf(scrollbarH);

                !adjustedScrollWidth && adjustScrollWidth();

                const newRatio = scrollWidth / scrollbarWidth;
                if ((ratioH === newRatio && Number.isFinite(newRatio)) || Number.isNaN(newRatio)) return;

                const offsetWidth = offsetWidthOf(viewport);

                const verticalScrollBarOffset = status() !== WITHOUT_SCROLL ? scrollbar.clientWidth + Math.max(NATIVE_SCROLL_WIDTH, 0) : 0;
                let containerOffsetWidth = offsetWidthOf(container) + verticalScrollBarOffset;

                if (containerOffsetWidth === scrollWidth && statusH() === WITHOUT_SCROLL)
                    return;

                ratioH = newRatio;
                styleOf(thumbH).width = (scrollbarWidth / newRatio) + 'px';


                if (horizontalScrollBarModeOf(props()) === SCROLLBAR_MODE_HIDDEN) {
                    if (statusH() !== WITHOUT_SCROLL)
                        hideHorizontalScrollbar(scrollbarH, viewport);

                    return
                }

                styleOf(container).width = (scrollWidth - verticalScrollBarOffset) + 'px';
                containerOffsetWidth = offsetWidthOf(container) + verticalScrollBarOffset;

                if (containerOffsetWidth < scrollWidth) {
                    adjustedScrollWidth = false;
                    showHorizontalScrollbar(scrollbarH, viewport, adjustScrollWidth);
                } else {
                    hideHorizontalScrollbar(scrollbarH, viewport);
                }

                const position = viewport.scrollLeft / (scrollWidth - offsetWidth);
                styleOf(thumbH).left = (position * (scrollbarWidth - offsetWidthOf(thumbH))) + 'px';
            };

            initTimeout = setTimeout(() => {
                resizeInterval = setInterval(() => {
                    updateVerticalScrollbar();
                    updateHorizontalScrollbar();
                }, 50);
            }, 200)
        };

        that[componentDidMount] = init;
        that[componentWillUnmount] = clear;

        that[componentDidUpdate] = (prevProps) => {
            if (scrollBarModeOf(props()) !== scrollBarModeOf(prevProps))
                init();
        };

        that.setScroll = (y) => {
            viewportRef().scrollTop = y
        };
        that.getScroll = () => viewportRef().scrollTop;
        that.getScrollHeight = () => scrollHeightOf(viewportRef());
        that.getHeight = () => containerRef().clientHeight;

        that[render] = () => {
            const _props = props();
            const {className, children} = _props;
            return (
                <div className={classNames('Scrollable', className, status() || WITH_SCROLL, statusH() + '-horizontal')} style={styleOf(_props)} ref={containerRef}>
                    <div className="viewport" ref={viewportRef}>
                        {children}
                    </div>
                    <div className={classNames('scrollbar', scrollBarModeOf(_props) || SCROLLBAR_MODE_AUTO)} ref={scrollbarRef}>
                        <div className="thumb" ref={thumbRef}/>
                    </div>
                    <div className={classNames('scrollbar horizontal', horizontalScrollBarModeOf(_props))} ref={horizontalScrollbarRef}>
                        <div className="thumb" ref={horizontalThumbRef}/>
                    </div>
                </div>
            )
        };
    }
}

export default Scrollable

Scrollable.defaultProps = {
    autoScrollTop: true,
    horizontalScrollBarMode: SCROLLBAR_MODE_HIDDEN
};

if (window.isNotProductionEnvironment) {
    Scrollable.propTypes = {
        scrollBarMode: PropTypes.oneOf([SCROLLBAR_MODE_AUTO, SCROLLBAR_MODE_HIDDEN, SCROLLBAR_MODE_VISIBLE]),
        horizontalScrollBarMode: PropTypes.oneOf([SCROLLBAR_MODE_AUTO, SCROLLBAR_MODE_HIDDEN, SCROLLBAR_MODE_VISIBLE]),
        className: PropTypes.string,
        style: PropTypes.object,
        onScrolledToBottom: PropTypes.func,
        onScrolledToTop: PropTypes.func,
        autoScrollTop: PropTypes.bool,
    }
}
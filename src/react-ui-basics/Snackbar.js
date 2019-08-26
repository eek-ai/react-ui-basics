import React from 'react';
import ReactCreateElement from './ReactCreateElement';
import './Snackbar.css'
import {classNames, setTimeout, clearTimeout} from "./Tools";
import {componentWillUnmount, render, props, className, PureComponent, stateGS} from "./ReactConstants";

const shown = 'shown';

class Snackbar extends PureComponent {

    constructor(properties) {
        super(properties);
        const that = this;
        that.state = {};
        const [
            isShow, setShow,
            getText, setText,
        ] = stateGS(this, 2);

        let timeout;
        that[componentWillUnmount] = () => clearTimeout(timeout);
        that[render] = () => {
            const _props = props(that);

            return (
                <div className={classNames(`Snackbar`, _props[className], isShow() && shown)}>
                    <div className="message">{getText() || _props.text}</div>
                </div>
            )
        };

        that.show = (text) => {
            if (isShow()) {
                clearTimeout(timeout);
                setShow(false);
                timeout = setTimeout(() => that.show(text), 260);
            } else {
                setShow(true);
                setText(text);
                timeout = setTimeout(setShow, 3000);
            }
        }
    }
}

export default Snackbar;
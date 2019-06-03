import React from 'react';
import ReactCreateElement from './ReactCreateElement';
import './Dropzone.css'
import {classNames, setOf, ref, preventDefault, stopPropagation} from "./Tools";
import {PureComponent} from "./ReactConstants";

const toArray = (o) => {
    if (o instanceof Array)
        return o;

    const l = [];
    for (let i = 0; i < o.length; i++) {
        l.push(o[i])
    }
    return l;
};

const prevent = (e) => {
    preventDefault(e);
    stopPropagation(e);
    return false;
};

class Dropzone extends PureComponent {

    static defaultProps = {
        clickable: true,
        multiple: true,
        droppable: true,
    };

    constructor(props) {
        super(props);
        this.state = {dragging: false};
        this.entries = [];
    }

    render = () => {
        const {children, className, disabled, clickable, multiple, droppable, overlayLabel} = this.props;
        const {dragging} = this.state;

        return <div className={classNames('Dropzone', className, dragging && 'dragging')}
                    ref={ref('el', this)}
                    onDragLeave={!disabled && droppable && this.onDragLeave || null}
                    onDragOver={!disabled && droppable && this.onDragOver || null}
                    onDragEnter={!disabled && droppable && this.onDragEnter || null}
                    onDrop={!disabled && droppable && this.onDrop || null}
        >
            {overlayLabel && <div className="overlay">
                <div className={'drop'}>
                    {overlayLabel}
                </div>
            </div>}
            {!disabled && clickable && <input className={'file'} type="file" multiple={!!multiple} onChange={this.onDrop}/>}
            {children}
        </div>
    };

    onDrop = (e) => {
        const dt = e.dataTransfer;
        const files = toArray(dt && dt.files || e.target.files);
        this.props.onDrop(files);
        this.setState({dragging: false});
        this.entries = [];
        prevent(e);
    };
    onDragOver = (e) => {
        const dt = e.dataTransfer;
        if (ignore(dt)) return;

        dt && (dt.dropEffect = 'copy');
        !this.state.dragging && this.setState({dragging: true});
        prevent(e);
    };
    onDragEnter = (e) => {
        const dt = e.dataTransfer;
        if (ignore(dt)) return;
        if (this.entries.indexOf(e.target) === -1) {
            this.entries.push(e.target)
        }

        dt && (dt.dropEffect = 'copy');
        !this.state.dragging && this.setState({dragging: true});
        prevent(e);
    };
    onDragLeave = (e) => {
        this.entries = this.entries.filter(el => el !== e.target);

        if (this.entries.length === 0)
            this.setState({dragging: false});

        prevent(e)
    };
}

const ignoredTypes = setOf([
    'text',
    'Text',
    'text/plain',
]);

const ignore = dt => dt && (!dt.types[0] || ignoredTypes[dt.types[0]]);

export default Dropzone;
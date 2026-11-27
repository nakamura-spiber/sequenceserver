import React, { Component } from 'react';

// nr merges identical sequences into one record. BLAST reports the record's
// title as all member titles joined by " >", each continuing with the member's
// seqid, e.g. "actin [Ovis aries] >ref|NP_001009945.1| actin [Pan troglodytes]".
// A single record can carry over a thousand titles (tens of kB of text), so we
// show the first one and let the user expand the rest, as NCBI BLAST does.
//
// Split only where " >" is followed by a seqid prefix (ref|, gb|, pdb|, sp|,
// prf||, ...), so a title that merely contains " >" is left whole.
const SEPARATOR = / >(?=[a-z]{2,4}\|)/;

export function splitMergedTitle(title) {
    const parts = (title || '').split(SEPARATOR);
    const others = parts.slice(1).map((part) => {
        const space = part.indexOf(' ');
        return space === -1
            ? { id: part, title: '' }
            : { id: part.slice(0, space), title: part.slice(space + 1) };
    });
    return { first: parts[0], others: others };
}

// Short plain-text form for tooltips: first title plus a count of the rest.
export function shortMergedTitle(title) {
    const { first, others } = splitMergedTitle(title);
    if (others.length === 0) return first;
    return `${first} (+${others.length.toLocaleString()} more)`;
}

export class MergedTitle extends Component {
    constructor(props) {
        super(props);
        this.state = { expanded: false };
        this.toggle = this.toggle.bind(this);
    }

    // The hit header folds the hit on mouseup after a mousedown inside it
    // (report.js, preventCollapseOnSelection). Keep the toggle's mouse events
    // from reaching that handler.
    stop(event) {
        event.stopPropagation();
    }

    toggle(event) {
        event.stopPropagation();
        event.preventDefault();
        this.setState({ expanded: !this.state.expanded });
    }

    render() {
        const { first, others } = splitMergedTitle(this.props.title);
        if (others.length === 0) {
            return <span className={this.props.className}>{this.props.title}</span>;
        }

        const label = this.state.expanded
            ? 'hide other titles'
            : `+${others.length.toLocaleString()} more title${others.length === 1 ? '' : 's'}`;

        return (
            <span className={this.props.className}>
                {first}
                {' '}
                <button type="button"
                    className="merged-titles-toggle text-seqblue hover:text-seqorange font-normal whitespace-nowrap print:!hidden"
                    title="nr merges identical sequences into one entry. Show or hide the titles of the other identical sequences."
                    aria-expanded={this.state.expanded}
                    onMouseDown={this.stop} onMouseUp={this.stop} onMouseMove={this.stop}
                    onClick={this.toggle}>
                    [{label}]
                </button>
                {this.state.expanded &&
                    <ul className="merged-titles-list block max-h-60 overflow-auto mt-1 ps-4 border-l border-gray-300 font-normal cursor-text"
                        onMouseDown={this.stop} onMouseUp={this.stop} onMouseMove={this.stop}>
                        {others.map((other, i) =>
                            <li key={i}><strong>{other.id}</strong> {other.title}</li>
                        )}
                    </ul>
                }
            </span>
        );
    }
}

export default MergedTitle;

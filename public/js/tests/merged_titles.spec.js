/* eslint-disable no-undef */
import React from 'react';
import $ from 'jquery';
import { render, screen, fireEvent } from '@testing-library/react';
import MergedTitle, { splitMergedTitle, shortMergedTitle } from '../merged_titles';

const MERGED = 'actin, cytoplasmic 1 [Ovis aries] >ref|NP_001009945.1| actin, cytoplasmic 1 [Pan troglodytes]' +
    ' >pdb|3BYH|A Chain A, Actin >prf||1234A actin >gb|AAA51567.1| beta-actin';

describe('splitMergedTitle', () => {
    it('splits nr merged titles at " >" before a seqid', () => {
        const { first, others } = splitMergedTitle(MERGED);
        expect(first).toBe('actin, cytoplasmic 1 [Ovis aries]');
        expect(others).toEqual([
            { id: 'ref|NP_001009945.1|', title: 'actin, cytoplasmic 1 [Pan troglodytes]' },
            { id: 'pdb|3BYH|A', title: 'Chain A, Actin' },
            { id: 'prf||1234A', title: 'actin' },
            { id: 'gb|AAA51567.1|', title: 'beta-actin' },
        ]);
    });

    it('leaves a title with a literal " >" whole', () => {
        const title = 'score >5 fold change >ten [Homo sapiens]';
        expect(splitMergedTitle(title)).toEqual({ first: title, others: [] });
    });

    it('handles plain, empty and missing titles', () => {
        expect(splitMergedTitle('actin [Homo sapiens]')).toEqual({ first: 'actin [Homo sapiens]', others: [] });
        expect(splitMergedTitle('')).toEqual({ first: '', others: [] });
        expect(splitMergedTitle(undefined)).toEqual({ first: '', others: [] });
    });
});

describe('shortMergedTitle', () => {
    it('gives the first title and a count', () => {
        expect(shortMergedTitle(MERGED)).toBe('actin, cytoplasmic 1 [Ovis aries] (+4 more)');
        expect(shortMergedTitle('actin [Homo sapiens]')).toBe('actin [Homo sapiens]');
    });
});

describe('MergedTitle', () => {
    it('renders a plain title unchanged, with no toggle', () => {
        render(<MergedTitle title="actin [Homo sapiens]" />);
        expect(screen.getByText('actin [Homo sapiens]')).toBeInTheDocument();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('shows the first title and expands the others on click', () => {
        render(<MergedTitle title={MERGED} />);
        expect(screen.getByText(/actin, cytoplasmic 1 \[Ovis aries\]/)).toBeInTheDocument();
        expect(screen.queryByText('ref|NP_001009945.1|')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: /\+4 more titles/ }));
        expect(screen.getByText('ref|NP_001009945.1|')).toBeInTheDocument();
        expect(screen.getByText('pdb|3BYH|A')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /hide other titles/ }));
        expect(screen.queryByText('ref|NP_001009945.1|')).toBeNull();
    });

    it('keeps toggle mouse events from the hit-folding handler on body', () => {
        const onBodyMouseDown = jest.fn();
        $('body').on('mousedown', onBodyMouseDown);
        try {
            render(<MergedTitle title={MERGED} />);
            fireEvent.mouseDown(screen.getByRole('button'));
            expect(onBodyMouseDown).not.toHaveBeenCalled();
        } finally {
            $('body').off('mousedown', onBodyMouseDown);
        }
    });
});

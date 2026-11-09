import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PhotoPrivacyReminder from '../../../src/components/analyze/PhotoPrivacyReminder';

describe('PhotoPrivacyReminder', () => {
    it('shows a concise permission reminder near photo upload controls', () => {
        render(<PhotoPrivacyReminder />);

        expect(screen.getByRole('note', { name: 'Photo privacy reminder' })).toHaveTextContent(
            'Please only upload photos you have permission to share.'
        );
    });
});

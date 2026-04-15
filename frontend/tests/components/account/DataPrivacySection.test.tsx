import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataPrivacySection from '../../../src/components/account/DataPrivacySection';

const defaultProps = {
    exporting: false,
    deleting: false,
    deleteConfirm: false,
    onExport: vi.fn(),
    onDeleteRequest: vi.fn(),
    onDeleteConfirm: vi.fn(),
    onDeleteCancel: vi.fn(),
};

describe('DataPrivacySection', () => {
    it('renders section title', () => {
        render(<DataPrivacySection {...defaultProps} />);
        expect(screen.getByText(/Data & Privacy/i)).toBeInTheDocument();
    });

    it('renders export and delete headings', () => {
        render(<DataPrivacySection {...defaultProps} />);
        expect(screen.getByText(/Export Personal Data/i)).toBeInTheDocument();
        expect(screen.getByText(/Delete Account/i)).toBeInTheDocument();
    });

    it('calls onExport when export button clicked', () => {
        const onExport = vi.fn();
        render(<DataPrivacySection {...defaultProps} onExport={onExport} />);
        fireEvent.click(screen.getByText(/Initiate Data Export/i));
        expect(onExport).toHaveBeenCalledOnce();
    });

    it('shows exporting state', () => {
        render(<DataPrivacySection {...defaultProps} exporting={true} />);
        expect(screen.getByText(/Exporting.../i)).toBeInTheDocument();
    });

    it('calls onDeleteRequest when Request Deletion clicked', () => {
        const onDeleteRequest = vi.fn();
        render(<DataPrivacySection {...defaultProps} onDeleteRequest={onDeleteRequest} />);
        fireEvent.click(screen.getByText(/Request Deletion/i));
        expect(onDeleteRequest).toHaveBeenCalledOnce();
    });

    it('shows confirmation UI when deleteConfirm is true', () => {
        render(<DataPrivacySection {...defaultProps} deleteConfirm={true} />);
        expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Yes, Delete/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('calls onDeleteConfirm when Yes Delete clicked', () => {
        const onDeleteConfirm = vi.fn();
        render(<DataPrivacySection {...defaultProps} deleteConfirm={true} onDeleteConfirm={onDeleteConfirm} />);
        fireEvent.click(screen.getByRole('button', { name: /Yes, Delete/i }));
        expect(onDeleteConfirm).toHaveBeenCalledOnce();
    });

    it('calls onDeleteCancel when Cancel clicked', () => {
        const onDeleteCancel = vi.fn();
        render(<DataPrivacySection {...defaultProps} deleteConfirm={true} onDeleteCancel={onDeleteCancel} />);
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(onDeleteCancel).toHaveBeenCalledOnce();
    });

    it('shows deleting state on confirm button', () => {
        render(<DataPrivacySection {...defaultProps} deleteConfirm={true} deleting={true} />);
        expect(screen.getByRole('button', { name: /Deleting.../i })).toBeDisabled();
    });
});

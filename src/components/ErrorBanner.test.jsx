/**
 * @module ErrorBanner.test
 * @description Component tests for ErrorBanner: renders error message, has role='alert',
 * dismiss button works, recovery action triggers callback, keyboard accessible.
 * [Pipeline-aligned: synthetic data only]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBanner, DEFAULT_ERROR_TYPE } from '@/components/ErrorBanner.jsx';

describe('ErrorBanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering error message', () => {
    it('renders the error message text', () => {
      render(<ErrorBanner message="Something went wrong." />);

      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    });

    it('renders the default error type label when none is provided', () => {
      render(<ErrorBanner message="Test error message." />);

      expect(screen.getByText(DEFAULT_ERROR_TYPE)).toBeInTheDocument();
    });

    it('renders a custom error type label when provided', () => {
      render(<ErrorBanner message="Test error." errorType="Storage Error" />);

      expect(screen.getByText('Storage Error')).toBeInTheDocument();
    });

    it('returns null when message is empty string', () => {
      const { container } = render(<ErrorBanner message="" />);

      expect(container.innerHTML).toBe('');
    });

    it('returns null when message is null', () => {
      const { container } = render(<ErrorBanner message={null} />);

      expect(container.innerHTML).toBe('');
    });

    it('returns null when message is undefined', () => {
      const { container } = render(<ErrorBanner message={undefined} />);

      expect(container.innerHTML).toBe('');
    });

    it('returns null when message is whitespace only', () => {
      const { container } = render(<ErrorBanner message="   " />);

      expect(container.innerHTML).toBe('');
    });

    it('returns null when message is a number', () => {
      const { container } = render(<ErrorBanner message={42} />);

      expect(container.innerHTML).toBe('');
    });

    it('renders the default error type when errorType is empty string', () => {
      render(<ErrorBanner message="Test error." errorType="" />);

      expect(screen.getByText(DEFAULT_ERROR_TYPE)).toBeInTheDocument();
    });

    it('renders the default error type when errorType is whitespace only', () => {
      render(<ErrorBanner message="Test error." errorType="   " />);

      expect(screen.getByText(DEFAULT_ERROR_TYPE)).toBeInTheDocument();
    });

    it('trims the error type label', () => {
      render(<ErrorBanner message="Test error." errorType="  Validation Error  " />);

      expect(screen.getByText('Validation Error')).toBeInTheDocument();
    });

    it('applies additional className when provided', () => {
      render(<ErrorBanner message="Test error." className="mt-4" />);

      const alert = screen.getByRole('alert');
      expect(alert.className).toContain('mt-4');
    });
  });

  describe('accessibility', () => {
    it('has role="alert"', () => {
      render(<ErrorBanner message="Test error." />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('has aria-live="assertive"', () => {
      render(<ErrorBanner message="Test error." />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('has aria-atomic="true"', () => {
      render(<ErrorBanner message="Test error." />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-atomic', 'true');
    });

    it('has tabIndex=-1 for programmatic focus', () => {
      render(<ErrorBanner message="Test error." />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('tabindex', '-1');
    });

    it('renders the AlertTriangle icon with aria-hidden', () => {
      render(<ErrorBanner message="Test error." />);

      const alert = screen.getByRole('alert');
      const svgs = alert.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
      // The first SVG should be the AlertTriangle icon
      expect(svgs[0]).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('dismiss button', () => {
    it('renders the dismiss button when onDismiss is provided', () => {
      const onDismiss = vi.fn();
      render(<ErrorBanner message="Test error." onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss error');
      expect(dismissButton).toBeInTheDocument();
    });

    it('does not render the dismiss button when onDismiss is not provided', () => {
      render(<ErrorBanner message="Test error." />);

      const dismissButton = screen.queryByLabelText('Dismiss error');
      expect(dismissButton).not.toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(<ErrorBanner message="Test error." onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss error');
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('dismiss button has aria-label "Dismiss error"', () => {
      const onDismiss = vi.fn();
      render(<ErrorBanner message="Test error." onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss error');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss error');
    });

    it('dismiss button is a button element', () => {
      const onDismiss = vi.fn();
      render(<ErrorBanner message="Test error." onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss error');
      expect(dismissButton.tagName.toLowerCase()).toBe('button');
    });

    it('dismiss button has type="button"', () => {
      const onDismiss = vi.fn();
      render(<ErrorBanner message="Test error." onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss error');
      expect(dismissButton).toHaveAttribute('type', 'button');
    });
  });

  describe('recovery action', () => {
    it('renders the action button when onAction and actionLabel are provided', () => {
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onAction={onAction}
          actionLabel="Reset Data"
        />,
      );

      const actionButton = screen.getByRole('button', { name: 'Reset Data' });
      expect(actionButton).toBeInTheDocument();
    });

    it('does not render the action button when onAction is not provided', () => {
      render(
        <ErrorBanner
          message="Test error."
          actionLabel="Reset Data"
        />,
      );

      const actionButton = screen.queryByRole('button', { name: 'Reset Data' });
      expect(actionButton).not.toBeInTheDocument();
    });

    it('does not render the action button when actionLabel is not provided', () => {
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onAction={onAction}
        />,
      );

      // Only the dismiss button should not be present either since onDismiss is not provided
      // There should be no action button
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });

    it('does not render the action button when actionLabel is empty string', () => {
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onAction={onAction}
          actionLabel=""
        />,
      );

      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });

    it('does not render the action button when actionLabel is whitespace only', () => {
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onAction={onAction}
          actionLabel="   "
        />,
      );

      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });

    it('calls onAction when action button is clicked', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onAction={onAction}
          actionLabel="Reset Data"
        />,
      );

      const actionButton = screen.getByRole('button', { name: 'Reset Data' });
      await user.click(actionButton);

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('action button has correct aria-label', () => {
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onAction={onAction}
          actionLabel="Reset Data"
        />,
      );

      const actionButton = screen.getByRole('button', { name: 'Reset Data' });
      expect(actionButton).toHaveAttribute('aria-label', 'Reset Data');
    });

    it('action button has type="button"', () => {
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onAction={onAction}
          actionLabel="Reset Data"
        />,
      );

      const actionButton = screen.getByRole('button', { name: 'Reset Data' });
      expect(actionButton).toHaveAttribute('type', 'button');
    });

    it('action button displays the action label text', () => {
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onAction={onAction}
          actionLabel="Retry Operation"
        />,
      );

      expect(screen.getByText('Retry Operation')).toBeInTheDocument();
    });
  });

  describe('keyboard accessibility', () => {
    it('dismisses the banner when Escape key is pressed and onDismiss is provided', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(<ErrorBanner message="Test error." onDismiss={onDismiss} />);

      const alert = screen.getByRole('alert');
      alert.focus();
      await user.keyboard('{Escape}');

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not throw when Escape is pressed without onDismiss', async () => {
      const user = userEvent.setup();
      render(<ErrorBanner message="Test error." />);

      const alert = screen.getByRole('alert');
      alert.focus();

      // Should not throw
      await user.keyboard('{Escape}');

      expect(alert).toBeInTheDocument();
    });

    it('dismiss button is keyboard focusable', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(<ErrorBanner message="Test error." onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss error');
      dismissButton.focus();
      expect(document.activeElement).toBe(dismissButton);
    });

    it('action button is keyboard focusable', async () => {
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onAction={onAction}
          actionLabel="Reset Data"
        />,
      );

      const actionButton = screen.getByRole('button', { name: 'Reset Data' });
      actionButton.focus();
      expect(document.activeElement).toBe(actionButton);
    });

    it('action button can be activated with Enter key', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onAction={onAction}
          actionLabel="Reset Data"
        />,
      );

      const actionButton = screen.getByRole('button', { name: 'Reset Data' });
      actionButton.focus();
      await user.keyboard('{Enter}');

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('dismiss button can be activated with Enter key', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(<ErrorBanner message="Test error." onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss error');
      dismissButton.focus();
      await user.keyboard('{Enter}');

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('combined dismiss and action', () => {
    it('renders both dismiss button and action button when both are provided', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onDismiss={onDismiss}
          onAction={onAction}
          actionLabel="Reset Data"
        />,
      );

      const dismissButton = screen.getByLabelText('Dismiss error');
      const actionButton = screen.getByRole('button', { name: 'Reset Data' });

      expect(dismissButton).toBeInTheDocument();
      expect(actionButton).toBeInTheDocument();
    });

    it('dismiss and action callbacks are independent', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onDismiss={onDismiss}
          onAction={onAction}
          actionLabel="Reset Data"
        />,
      );

      const actionButton = screen.getByRole('button', { name: 'Reset Data' });
      await user.click(actionButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('clicking dismiss does not trigger action callback', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Test error."
          onDismiss={onDismiss}
          onAction={onAction}
          actionLabel="Reset Data"
        />,
      );

      const dismissButton = screen.getByLabelText('Dismiss error');
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onAction).not.toHaveBeenCalled();
    });
  });

  describe('focus management', () => {
    it('focuses the banner on mount', () => {
      render(<ErrorBanner message="Test error." />);

      const alert = screen.getByRole('alert');
      expect(document.activeElement).toBe(alert);
    });

    it('refocuses when message changes', () => {
      const { rerender } = render(<ErrorBanner message="First error." />);

      const alert = screen.getByRole('alert');
      // Blur the alert to simulate user interaction
      alert.blur();

      rerender(<ErrorBanner message="Second error." />);

      // After rerender with new message, the banner should be focused again
      const updatedAlert = screen.getByRole('alert');
      expect(document.activeElement).toBe(updatedAlert);
    });
  });

  describe('error type variations', () => {
    it('renders "Storage Error" type label', () => {
      render(<ErrorBanner message="Failed to read data." errorType="Storage Error" />);

      expect(screen.getByText('Storage Error')).toBeInTheDocument();
    });

    it('renders "Validation Error" type label', () => {
      render(<ErrorBanner message="Invalid data format." errorType="Validation Error" />);

      expect(screen.getByText('Validation Error')).toBeInTheDocument();
    });

    it('renders "Generation Error" type label', () => {
      render(<ErrorBanner message="Failed to generate variants." errorType="Generation Error" />);

      expect(screen.getByText('Generation Error')).toBeInTheDocument();
    });

    it('renders "Loading Error" type label', () => {
      render(<ErrorBanner message="Failed to load data." errorType="Loading Error" />);

      expect(screen.getByText('Loading Error')).toBeInTheDocument();
    });
  });

  describe('DEFAULT_ERROR_TYPE constant', () => {
    it('has the value "Error"', () => {
      expect(DEFAULT_ERROR_TYPE).toBe('Error');
    });
  });

  describe('edge cases', () => {
    it('handles onDismiss that is not a function gracefully', () => {
      render(<ErrorBanner message="Test error." onDismiss="not-a-function" />);

      // Should not render dismiss button when onDismiss is not a function
      const dismissButton = screen.queryByLabelText('Dismiss error');
      expect(dismissButton).not.toBeInTheDocument();
    });

    it('handles onAction that is not a function gracefully', () => {
      render(
        <ErrorBanner
          message="Test error."
          onAction="not-a-function"
          actionLabel="Reset"
        />,
      );

      // Should not render action button when onAction is not a function
      const actionButton = screen.queryByRole('button', { name: 'Reset' });
      expect(actionButton).not.toBeInTheDocument();
    });

    it('renders long error messages without breaking layout', () => {
      const longMessage = 'This is a very long error message that should still render correctly without breaking the layout of the error banner component. '.repeat(5);
      render(<ErrorBanner message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('renders with all props provided', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();
      render(
        <ErrorBanner
          message="Complete error message."
          errorType="Custom Error"
          onDismiss={onDismiss}
          onAction={onAction}
          actionLabel="Fix It"
          className="custom-class"
        />,
      );

      expect(screen.getByText('Complete error message.')).toBeInTheDocument();
      expect(screen.getByText('Custom Error')).toBeInTheDocument();
      expect(screen.getByLabelText('Dismiss error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Fix It' })).toBeInTheDocument();

      const alert = screen.getByRole('alert');
      expect(alert.className).toContain('custom-class');
    });
  });
});
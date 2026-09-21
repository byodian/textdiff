// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBar } from '../src/components/StatusBar';

describe('StatusBar Responsive & Anti-wrapping', () => {
  const defaultProps = {
    language: 'typescript',
    code: 'const greeting = "hello world";\nconsole.log(greeting);\n',
    isDiffMode: false,
    isSidebarOpen: false,
    onFormatDocument: vi.fn(),
    onOpenLanguagePicker: vi.fn(),
    onAutoDetectLanguage: vi.fn(),
  };

  it('guarantees whitespace-nowrap and overflow-hidden on the footer container', () => {
    const { container } = render(React.createElement(StatusBar, defaultProps));
    const footer = container.querySelector('footer');

    expect(footer).toBeDefined();
    expect(footer?.className).toContain('whitespace-nowrap');
    expect(footer?.className).toContain('overflow-hidden');
    expect(footer?.className).toContain('h-7');
  });

  it('renders line and character count with full statistics in hover tooltip', () => {
    render(React.createElement(StatusBar, defaultProps));

    // Displays line count
    expect(screen.getByText(/3 lines/i)).toBeDefined();

    // Has tooltip with complete lines and characters count
    const countContainer = screen.getByTitle('3 lines, 55 characters');
    expect(countContainer).toBeDefined();
    expect(countContainer.className).toContain('shrink-0');
  });

  it('applies tighter responsive classes when isSidebarOpen is true', () => {
    const { rerender } = render(
      React.createElement(StatusBar, {
        ...defaultProps,
        isSidebarOpen: false,
      })
    );

    // When sidebar is closed (spacious):
    const formatClosed = screen.getByText('Format');
    expect(formatClosed.className).toContain('hidden sm:inline');

    const charsClosed = screen.getByText(/, 55 chars/);
    expect(charsClosed.className).toContain('hidden md:inline');

    const utfClosed = screen.getByText('UTF-8');
    expect(utfClosed.className).toContain('hidden md:inline');

    // Re-render with sidebar open:
    rerender(
      React.createElement(StatusBar, {
        ...defaultProps,
        isSidebarOpen: true,
      })
    );

    const formatOpen = screen.getByText('Format');
    expect(formatOpen.className).toContain('hidden xl:inline');

    const charsOpen = screen.getByText(/, 55 chars/);
    expect(charsOpen.className).toContain('hidden lg:inline');

    const utfOpen = screen.getByText('UTF-8');
    expect(utfOpen.className).toContain('hidden lg:inline');
  });

  it('always keeps error badge visible even when space is constrained', () => {
    const onToggleDiagnostics = vi.fn();
    render(
      React.createElement(StatusBar, {
        ...defaultProps,
        language: 'json',
        isSidebarOpen: true,
        diagnostics: [
          {
            id: 'e1',
            line: 1,
            column: 1,
            severity: 'error',
            message: 'Unexpected token',
          },
        ],
        onToggleDiagnostics,
      })
    );

    const errorBtn = screen.getByRole('button', { name: /1 个语法错误/i });
    expect(errorBtn).toBeDefined();
    expect(screen.getByText('1 错误')).toBeDefined();

    fireEvent.click(errorBtn);
    expect(onToggleDiagnostics).toHaveBeenCalledTimes(1);
  });

  it('displays compact diff stats without wrapping in diff mode', () => {
    const onPrevDiffChunk = vi.fn();
    const onNextDiffChunk = vi.fn();

    render(
      React.createElement(StatusBar, {
        ...defaultProps,
        isDiffMode: true,
        diffStats: { added: 15, removed: 4, hasChanges: true },
        onPrevDiffChunk,
        onNextDiffChunk,
      })
    );

    expect(screen.getByText('+15')).toBeDefined();
    expect(screen.getByText('-4')).toBeDefined();

    const prevBtn = screen.getByTitle('Previous Change');
    const nextBtn = screen.getByTitle('Next Change');
    expect(prevBtn).toBeDefined();
    expect(nextBtn).toBeDefined();

    fireEvent.click(prevBtn);
    expect(onPrevDiffChunk).toHaveBeenCalledTimes(1);

    fireEvent.click(nextBtn);
    expect(onNextDiffChunk).toHaveBeenCalledTimes(1);
  });
});

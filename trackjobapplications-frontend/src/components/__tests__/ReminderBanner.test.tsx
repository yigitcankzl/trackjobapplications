import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ReminderBanner from '../dashboard/ReminderBanner'
import { ApplicationReminder } from '../../hooks/useApplicationReminders'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, opts?: Record<string, unknown>) => opts ? `${k}:${JSON.stringify(opts)}` : k }),
}))

vi.mock('../icons', () => ({
  BellIcon: () => <svg data-testid="bell-icon" />,
}))

function makeReminder(id: number): ApplicationReminder {
  return {
    app: {
      id,
      company: `Company ${id}`,
      position: `Engineer ${id}`,
      status: 'applied',
      applied_date: '2024-01-01',
      source: '',
      url: '',
      notes: '',
      created_at: '',
      updated_at: '',
      tags: [],
      is_pinned: false,
    },
    daysSinceUpdate: 10 + id,
  }
}

describe('ReminderBanner', () => {
  it('renders nothing when reminders is empty', () => {
    const { container } = render(<ReminderBanner reminders={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the banner when reminders exist', () => {
    render(<ReminderBanner reminders={[makeReminder(1)]} />)
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument()
  })

  it('shows count in title', () => {
    render(<ReminderBanner reminders={[makeReminder(1), makeReminder(2)]} />)
    expect(screen.getByText(/dashboard.reminders.title/)).toBeInTheDocument()
  })

  it('does not show reminder list before expanding', () => {
    render(<ReminderBanner reminders={[makeReminder(1)]} />)
    expect(screen.queryByText('Company 1')).not.toBeInTheDocument()
  })

  it('shows reminder list after clicking toggle', () => {
    render(<ReminderBanner reminders={[makeReminder(1)]} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Company 1')).toBeInTheDocument()
    expect(screen.getByText('Engineer 1')).toBeInTheDocument()
  })

  it('shows all reminders when expanded', () => {
    const reminders = [makeReminder(1), makeReminder(2), makeReminder(3)]
    render(<ReminderBanner reminders={reminders} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Company 1')).toBeInTheDocument()
    expect(screen.getByText('Company 2')).toBeInTheDocument()
    expect(screen.getByText('Company 3')).toBeInTheDocument()
  })

  it('collapses after clicking toggle twice', () => {
    render(<ReminderBanner reminders={[makeReminder(1)]} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Company 1')).not.toBeInTheDocument()
  })

  it('renders daysAgo for each reminder when expanded', () => {
    render(<ReminderBanner reminders={[makeReminder(5)]} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/dashboard.reminders.daysAgo/)).toBeInTheDocument()
  })
})

// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TextField } from './TextField'
import { styleOf } from './test-utils'

function Controlled(props: { multiline?: boolean }) {
  const [value, setValue] = useState('')
  return (
    <TextField
      label="Title"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      {...props}
    />
  )
}

describe('TextField', () => {
  it('labels the input and marks it required', () => {
    render(<TextField label="Slug" required size="small" />)
    const input = screen.getByRole('textbox', { name: /Slug/ })
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveProperty('required', true)
    expect(screen.getByText(/Slug/, { selector: 'label' }).textContent).toBe(
      `Slug${String.fromCodePoint(0x2009)}*`,
    )
    expect(styleOf(input, 'padding')).toBe('8.5px 14px')
    expect(styleOf(input, 'height')).toBe('calc(1.4375em + 17px)')
    expect(styleOf(input, 'box-sizing')).toBe('border-box')
  })

  it('floats the label once the field has a value', () => {
    render(<Controlled />)
    const input = screen.getByRole('textbox', { name: 'Title' })
    const label = screen.getByText('Title', { selector: 'label' })
    expect(styleOf(label, 'transform')).toBe('translate(14px,16px) scale(1)')
    fireEvent.change(input, { target: { value: 'Summer' } })
    expect((input as HTMLInputElement).value).toBe('Summer')
    expect(label.hasAttribute('data-filled')).toBe(true)
    expect(styleOf(label, 'transform')).toBe('translate(14px,-9px) scale(.75)')
  })

  it('floats the label while focused', () => {
    render(<TextField label="Name" />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    fireEvent.focus(input)
    const label = screen.getByText('Name', { selector: 'label' })
    expect(label.hasAttribute('data-focused')).toBe(true)
    expect(styleOf(label, 'transform')).toBe('translate(14px,-9px) scale(.75)')
  })

  it('describes the input with helper text and flags errors', () => {
    render(
      <TextField
        label="Slug"
        error
        helperText="Lowercase letters, numbers and dashes"
      />,
    )
    const input = screen.getByRole('textbox', { name: 'Slug' })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const helper = screen.getByText('Lowercase letters, numbers and dashes')
    expect(input.getAttribute('aria-describedby')).toContain(helper.id)
    expect(styleOf(helper, 'color')).toBe('#d32f2f')
    expect(
      styleOf(screen.getByText('Slug', { selector: 'label' }), 'color'),
    ).toBe('#d32f2f')
  })

  it('reserves helper text height for a blank helperText', () => {
    render(<TextField label="Slug" helperText=" " />)
    expect(
      screen.getByText(String.fromCodePoint(0x200b), { selector: 'p' }),
    ).toBeTruthy()
  })

  it('passes input attributes through and reports changes', () => {
    const onChange = vi.fn()
    const onBlur = vi.fn()
    render(
      <TextField
        placeholder="Caption"
        maxLength={5}
        disabled={false}
        onChange={onChange}
        onBlur={onBlur}
      />,
    )
    const input = screen.getByPlaceholderText('Caption')
    expect(input.getAttribute('maxlength')).toBe('5')
    fireEvent.change(input, { target: { value: 'hi' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    fireEvent.blur(input)
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('disables the control', () => {
    render(<TextField label="Off" disabled />)
    expect(screen.getByRole('textbox', { name: 'Off' })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('renders a textarea when multiline', () => {
    render(<TextField label="Caption" multiline minRows={2} maxRows={4} />)
    const textarea = screen.getByRole('textbox', { name: 'Caption' })
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(textarea.getAttribute('rows')).toBe('2')
    expect(styleOf(textarea, 'resize')).toBe('none')
  })
})

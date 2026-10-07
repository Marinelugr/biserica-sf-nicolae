interface Props {
  action: string
  id: string
  placeholder: string
  button: string
  defaultValue?: string
  name?: string
  hidden?: Record<string, string>
}

/** Formular de căutare GET (funcționează și fără JavaScript). */
export default function SearchForm({ action, id, placeholder, button, defaultValue, name = 'q', hidden }: Props) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      className="flex items-center gap-2 w-full"
      style={{ border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999, padding: '5px 5px 5px 18px', background: 'rgba(5,10,26,.6)' }}
    >
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <input
        id={id}
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent outline-none text-[18px] text-ink placeholder:text-[#8d97b0]"
      />
      <button type="submit" className="btn red sm shrink-0">{button}</button>
    </form>
  )
}

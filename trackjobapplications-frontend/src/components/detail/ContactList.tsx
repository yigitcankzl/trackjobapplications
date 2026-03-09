import { useEffect, useState } from 'react'
import { ApplicationContact } from '../../types'
import { getContacts, createContact, deleteContact } from '../../services/contacts'
import { useToast } from '../../context/ToastContext'

interface Props {
  applicationId: number
}

export default function ContactList({ applicationId }: Props) {
  const { addToast } = useToast()
  const [contacts, setContacts] = useState<ApplicationContact[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '' })

  useEffect(() => {
    let active = true
    getContacts(applicationId)
      .then(data => { if (active) setContacts(data) })
      .catch(() => { if (active) addToast('Failed to load contacts', 'error') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [applicationId, addToast])

  async function handleAdd() {
    if (!form.name.trim()) return
    try {
      const c = await createContact(applicationId, form)
      setContacts(prev => [c, ...prev])
      setForm({ name: '', email: '', phone: '', role: '' })
      setShowAdd(false)
    } catch {
      addToast('Failed to add contact', 'error')
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteContact(applicationId, id)
      setContacts(prev => prev.filter(c => c.id !== id))
    } catch {
      addToast('Failed to delete contact', 'error')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Contacts</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showAdd && (
        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Name *" className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100" />
          <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="Role" className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100" />
          <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100" />
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100" />
          <button onClick={handleAdd} className="col-span-2 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Add Contact</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : contacts.length === 0 && !showAdd ? (
        <p className="text-xs text-gray-400">No contacts yet.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => (
            <div key={c.id} className="flex items-start justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm font-medium dark:text-gray-200">{c.name}</p>
                {c.role && <p className="text-xs text-gray-500">{c.role}</p>}
                <div className="flex gap-3 mt-0.5">
                  {c.email && <a href={`mailto:${c.email}`} className="text-xs text-blue-500 hover:underline">{c.email}</a>}
                  {c.phone && <span className="text-xs text-gray-500">{c.phone}</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">&times;</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

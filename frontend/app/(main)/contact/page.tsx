// @AI-HINT: Contact directory - support and sales contact forms
import React from 'react';
import commonStyles from './Contact.common.module.css';

export default function ContactPage() {
  return (
    <main className={commonStyles.container} style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' }}>
      <h1 className={commonStyles.title} style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>Contact Us</h1>
      <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#64748b', textAlign: 'center', marginBottom: '3rem' }}>
        Have a question or need help? Our support team is here for you.
      </p>

      <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#f8fafc', padding: '3rem', borderRadius: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
           <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>First Name</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
           </div>
           <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>Last Name</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
           </div>
        </div>
        <div>
           <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>Email Address</label>
           <input type="email" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
           <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>Subject</label>
           <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}>
              <option>General Inquiry</option>
              <option>Billing Support</option>
              <option>Technical Issue</option>
              <option>Report a User</option>
           </select>
        </div>
        <div>
           <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>Message</label>
           <textarea rows={5} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}></textarea>
        </div>
        <button type="button" style={{ background: '#4573df', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}>
           Send Message
        </button>
      </form>
    </main>
  );
}

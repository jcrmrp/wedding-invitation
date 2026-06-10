import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

interface Guest {
  id: string;
  name: string;
  email: string | null;
  rsvp_status: string | null;
  dietary_restrictions: string | null;
}

interface RSVPFormProps {
  coupleName?: string;
  isEmbedded?: boolean;
}
function RSVPForm({ coupleName: propCoupleName, isEmbedded = false }: RSVPFormProps) {
  const params = useParams<{ coupleName: string; token?: string }>();
  const coupleName = propCoupleName || params.coupleName;
  const token = params.token;
  const [wedding, setWedding] = useState<any>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [rsvpLocked, setRsvpLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');

  const [name, setName] = useState('');
  const [attending, setAttending] = useState<string>('yes');
  const [mealChoice, setMealChoice] = useState('');
  const [dietary, setDietary] = useState('');
  const [message, setMessage] = useState('');
  const [plusOne, setPlusOne] = useState(false);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWedding = async () => {
      if (!coupleName) {
        setLoading(false);
        return;
      }
      setLoading(true);

      let { data, error } = await supabase
        .from('weddings')
        .select('*')
        .eq('custom_url', coupleName)
        .eq('is_published', true)
        .maybeSingle();

      if (!data && !error) {
        const { data: byName } = await supabase
          .from('weddings')
          .select('*')
          .ilike('couple_names', coupleName)
          .eq('is_published', true)
          .maybeSingle();
        data = byName;
        error = byName ? null : { message: 'no match by name' } as any;
      }

      if (error || !data) {
        console.error('Error fetching wedding:', error);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setWedding(data);

      // Check if RSVP is locked
      const weddingDate = data.wedding_date ? new Date(data.wedding_date) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check deadline (1 week before wedding)
      if (data.rsvp_deadline) {
        const deadline = new Date(data.rsvp_deadline);
        deadline.setHours(0, 0, 0, 0);
        if (today > deadline) {
          setRsvpLocked(true);
          setLockReason('RSVP deadline has passed');
        }
      } else if (weddingDate) {
        // Auto-calculate deadline as 1 week before wedding
        const deadline = new Date(weddingDate);
        deadline.setDate(deadline.getDate() - 7);
        deadline.setHours(0, 0, 0, 0);
        if (today > deadline) {
          setRsvpLocked(true);
          setLockReason('RSVP deadline (1 week before wedding) has passed');
        }
        // After wedding date
        if (today > weddingDate) {
          setRsvpLocked(true);
          setLockReason('The wedding has already occurred');
        }
      }

      if (token) {
        const { data: guestData } = await supabase
          .from('guests')
          .select('*')
          .eq('rsvp_token', token)
          .maybeSingle();

        if (guestData) {
          setGuest(guestData);
          setName(guestData.name || '');
          setAttending(guestData.rsvp_status === 'declined' ? 'no' : 'yes');
          setDietary(guestData.dietary_restrictions || '');
          setNumberOfGuests(guestData.number_of_guests || 1);
        }
      }

      setLoading(false);
    };

    fetchWedding();
  }, [coupleName, token]);

  const getMealOptions = () => {
    if (!wedding) return [];
    try {
      return wedding.meal_options ? JSON.parse(wedding.meal_options) : [];
    } catch {
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!name.trim()) {
      setError('Please enter your name');
      setSubmitting(false);
      return;
    }

    const rsvpStatus = attending === 'yes' ? 'confirmed' : 'declined';

      if (token && guest) {
        const { error: updateError } = await supabase
          .from('guests')
          .update({
            name: name.trim(),
            rsvp_status: rsvpStatus,
            meal_choice: attending === 'yes' ? mealChoice : null,
            dietary_restrictions: dietary.trim() || null,
            message_to_couple: message.trim() || null,
            number_of_guests: attending === 'yes' ? (plusOne ? 2 : 1) : 1,
          })
          .eq('id', guest.id);

      if (updateError) {
        console.error('Update error:', updateError);
        setError('Failed to update RSVP. Please try again.');
        setSubmitting(false);
        return;
      }
    } else if (wedding?.id) {
      const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { error: insertError } = await supabase
        .from('guests')
        .insert({
          wedding_id: wedding.id,
          name: name.trim(),
          email: null,
          rsvp_status: rsvpStatus,
          meal_choice: attending === 'yes' ? mealChoice : null,
          dietary_restrictions: dietary.trim() || null,
          message_to_couple: message.trim() || null,
          number_of_guests: attending === 'yes' ? (plusOne ? 2 : 1) : 1,
          rsvp_token: newToken,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Failed to submit RSVP. Please try again.');
        setSubmitting(false);
        return;
      }
    } else {
      setError('Wedding not found. Please check your invitation link.');
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        color: '#7b6a5d',
        background: '#faf4eb',
      }}>
        Loading RSVP…
      </div>
    );
  }

  if (rsvpLocked) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: 'Georgia, serif',
        color: '#4a3f35',
        background: '#faf4eb',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔒</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 400, margin: '0 0 12px' }}>
          RSVP Closed
        </h1>
        <p style={{ color: '#7b6a5d', maxWidth: '400px', lineHeight: 1.6 }}>
          {lockReason || 'The RSVP deadline has passed for this wedding.'}
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: 'Georgia, serif',
        color: '#4a3f35',
        background: '#faf4eb',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💌</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 400, margin: '0 0 12px' }}>
          Invitation Not Found
        </h1>
        <p style={{ color: '#7b6a5d', maxWidth: '400px', lineHeight: 1.6 }}>
          This invitation link may be invalid or the wedding has not been published yet.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontFamily: 'Georgia, serif',
          background: linearGradientBackground(wedding),
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ fontSize: '5rem', marginBottom: '24px' }}
        >
          {attending === 'yes' ? '💖' : '😔'}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
            fontWeight: 400,
            color: '#4a3f35',
            margin: '0 0 12px',
            fontStyle: 'italic',
          }}
        >
          {attending === 'yes' ? 'Thank You!' : 'We’ll Miss You'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            color: '#7b6a5d',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            maxWidth: '480px',
            margin: 0,
          }}
        >
          {attending === 'yes'
            ? 'Your presence will make the day even more special. We can’t wait to celebrate with you!'
            : 'Thank you for letting us know. You’ll be in our thoughts on this special day.'}
        </motion.p>
        {guest && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              marginTop: '24px',
              fontSize: '0.85rem',
              color: '#b07f56',
              fontFamily: 'monospace',
            }}
          >
            Update anytime: {window.location.origin}/rsvp/{wedding?.custom_url}/{token}
          </motion.p>
        )}
      </motion.div>
    );
  }

  const mealOptions = getMealOptions();

  return (
    <div style={{
      minHeight: '100vh',
      background: linearGradientBackground(wedding),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Georgia, serif',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: '#fffdf9',
          borderRadius: '20px',
          maxWidth: '560px',
          width: '100%',
          padding: '40px 36px',
          boxShadow: '0 20px 60px rgba(74,63,53,0.15)',
          border: '1px solid rgba(229,217,206,0.6)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💌</div>
          <h1 style={{
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 400,
            color: '#4a3f35',
            margin: '0 0 8px',
            fontStyle: 'italic',
          }}>
            RSVP
          </h1>
          <p style={{ color: '#7b6a5d', margin: 0, fontSize: '0.95rem' }}>
            {wedding?.couple_names} • {wedding?.wedding_date
              ? new Date(wedding.wedding_date).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })
              : ''}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#7b6a5d',
              marginBottom: '6px',
              fontWeight: 600,
            }}>
              Your Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Dela Cruz"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1.5px solid #e5d9ce',
                background: '#faf4eb',
                fontSize: '0.95rem',
                fontFamily: 'Georgia, serif',
                color: '#4a3f35',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#b07f56'}
              onBlur={(e) => e.target.style.borderColor = '#e5d9ce'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#7b6a5d',
              marginBottom: '6px',
              fontWeight: 600,
            }}>
              Will you attend?
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { value: 'yes', label: 'Joyfully Accept', emoji: '💖' },
                { value: 'no', label: 'Regretfully Decline', emoji: '😔' },
                { value: 'maybe', label: 'Maybe', emoji: '🤔' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAttending(option.value)}
                  style={{
                    flex: 1,
                    padding: '14px 12px',
                    borderRadius: '12px',
                    border: attending === option.value
                      ? '2px solid #b07f56'
                      : '1.5px solid #e5d9ce',
                    background: attending === option.value ? '#f5e6d8' : '#faf4eb',
                    color: attending === option.value ? '#4a3f35' : '#7b6a5d',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: attending === option.value ? 700 : 500,
                    fontFamily: 'Georgia, serif',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{option.emoji}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {attending !== 'no' && (
            <>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#7b6a5d',
                  marginBottom: '8px',
                  fontWeight: 600,
                }}>
                  Will you bring a plus one?
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { value: false, label: 'Just Me', emoji: '🧑‍🤝‍🧑' },
                    { value: true, label: 'Yes, +1', emoji: '👫' },
                  ].map((option) => (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => setPlusOne(option.value)}
                      style={{
                        flex: 1,
                        padding: '14px 12px',
                        borderRadius: '12px',
                        border: plusOne === option.value
                          ? '2px solid #b07f56'
                          : '1.5px solid #e5d9ce',
                        background: plusOne === option.value ? '#f5e6d8' : '#faf4eb',
                        color: plusOne === option.value ? '#4a3f35' : '#7b6a5d',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: plusOne === option.value ? 700 : 500,
                        fontFamily: 'Georgia, serif',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '1.4rem' }}>{option.emoji}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {mealOptions.length > 0 && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#7b6a5d',
                    marginBottom: '6px',
                    fontWeight: 600,
                  }}>
                    Meal Preference
                  </label>
                  <select
                    value={mealChoice}
                    onChange={(e) => setMealChoice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #e5d9ce',
                      background: '#faf4eb',
                      fontSize: '0.95rem',
                      fontFamily: 'Georgia, serif',
                      color: '#4a3f35',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">Select a meal…</option>
                    {mealOptions.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#7b6a5d',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}>
                  Dietary Restrictions
                </label>
                <input
                  type="text"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  placeholder="Vegetarian, allergies, etc."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #e5d9ce',
                    background: '#faf4eb',
                    fontSize: '0.95rem',
                    fontFamily: 'Georgia, serif',
                    color: '#4a3f35',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#b07f56'}
                  onBlur={(e) => e.target.style.borderColor = '#e5d9ce'}
                />
              </div>
            </>
          )}

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#7b6a5d',
              marginBottom: '6px',
              fontWeight: 600,
            }}>
              Message to the Couple
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your wishes or words of celebration…"
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1.5px solid #e5d9ce',
                background: '#faf4eb',
                fontSize: '0.95rem',
                fontFamily: 'Georgia, serif',
                color: '#4a3f35',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#b07f56'}
              onBlur={(e) => e.target.style.borderColor = '#e5d9ce'}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '10px',
              color: '#b91c1c',
              fontSize: '0.85rem',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: submitting ? '#b07f5680' : '#b07f56',
              color: '#fff',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: 700,
              fontFamily: 'Georgia, serif',
              marginTop: '8px',
              boxShadow: '0 4px 14px rgba(176,127,86,0.3)',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'Submitting…' : guest ? 'Update RSVP' : 'Send RSVP'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '0.78rem',
          color: '#b07f5680',
        }}>
          Created with ❤️ for {wedding?.couple_names}
        </p>
      </motion.div>
    </div>
  );
}

function linearGradientBackground(wedding: any): string {
  const primary = wedding?.dress_code_primary_color || '#b07f56';
  const secondary = wedding?.dress_code_secondary_color || '#e5d9ce';
  return `linear-gradient(180deg, ${secondary} 0%, ${primary}22 50%, ${secondary} 100%)`;
}

export default RSVPForm;

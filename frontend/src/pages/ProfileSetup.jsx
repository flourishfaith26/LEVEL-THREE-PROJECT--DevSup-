import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { styled, keyframes } from '../stitches.config.js';
import { Globe, Briefcase, Link as LinkIcon, CheckCircle, ShieldCheck, User as UserIcon, Code2, Loader2, Camera } from 'lucide-react';

const fadeIn = keyframes({
  '0%': { opacity: 0, transform: 'scale(0.95)' },
  '100%': { opacity: 1, transform: 'scale(1)' },
});

const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

const SpinningLoader = styled(Loader2, {
  animation: `${spin} 1s linear infinite`
});

const PageContainer = styled('div', {
  flex: 1,
  width: '100%',
  overflowY: 'auto',
  backgroundColor: '$bg',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '40px 20px',
  backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(6,182,212,0.15), transparent 50%)'
});

const FormContainer = styled('div', {
  backgroundColor: '$surface',
  borderRadius: '24px',
  width: '100%',
  maxWidth: '700px',
  flexShrink: 0,
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  animation: `${fadeIn} 0.5s ease-out`,
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid $border',
  position: 'relative',
  overflow: 'hidden'
});

const Header = styled('div', {
  padding: '40px 40px 32px',
  borderBottom: '1px solid $border',
  textAlign: 'center',
  background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(0,0,0,0) 100%)',
});

const Title = styled('h1', {
  margin: '0 0 12px 0',
  fontSize: '2.5rem',
  color: '$textMain',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px'
});

const Subtitle = styled('p', {
  margin: 0,
  color: '$textMuted',
  fontSize: '1.1rem',
  lineHeight: 1.6,
  maxWidth: '500px',
  marginLeft: 'auto',
  marginRight: 'auto'
});

const FormContent = styled('div', {
  padding: '40px',
  display: 'flex',
  flexDirection: 'column',
  gap: '32px'
});

const Section = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
});

const SectionTitle = styled('h3', {
  margin: 0,
  fontSize: '1.3rem',
  color: '$accent',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontWeight: '600'
});

const InputGroup = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
});

const Label = styled('label', {
  color: '$textMain',
  fontSize: '0.95rem',
  fontWeight: '500'
});

const Input = styled('input', {
  backgroundColor: '$bg',
  border: '1px solid $border',
  borderRadius: '12px',
  padding: '16px 20px',
  color: '$textMain',
  fontSize: '1.05rem',
  transition: 'all 0.2s',
  outline: 'none',
  width: '100%',
  '&:focus': {
    borderColor: '$accent',
    boxShadow: '0 0 0 2px rgba(6, 182, 212, 0.2)'
  }
});

const TextArea = styled('textarea', {
  backgroundColor: '$bg',
  border: '1px solid $border',
  borderRadius: '12px',
  padding: '16px 20px',
  color: '$textMain',
  fontSize: '1.05rem',
  transition: 'all 0.2s',
  outline: 'none',
  width: '100%',
  resize: 'vertical',
  minHeight: '120px',
  '&:focus': {
    borderColor: '$accent',
    boxShadow: '0 0 0 2px rgba(6, 182, 212, 0.2)'
  }
});

const Select = styled('select', {
  backgroundColor: '$bg',
  border: '1px solid $border',
  borderRadius: '12px',
  padding: '16px 20px',
  color: '$textMain',
  fontSize: '1.05rem',
  transition: 'all 0.2s',
  outline: 'none',
  width: '100%',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2306B6D4%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 20px top 50%',
  backgroundSize: '14px auto',
  '&:focus': {
    borderColor: '$accent',
    boxShadow: '0 0 0 2px rgba(6, 182, 212, 0.2)'
  }
});

const Footer = styled('div', {
  padding: '32px 40px',
  borderTop: '1px solid $border',
  display: 'flex',
  justifyContent: 'flex-end',
  backgroundColor: 'rgba(255,255,255,0.02)',
});

const SubmitButton = styled('button', {
  backgroundColor: '$accent',
  color: '#fff',
  border: 'none',
  padding: '16px 32px',
  borderRadius: '12px',
  fontSize: '1.1rem',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  transition: 'all 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(6, 182, 212, 0.3)'
  },
  '&:disabled': {
    opacity: 0.7,
    cursor: 'not-allowed',
    transform: 'none'
  }
});

const InfoBox = styled('div', {
  backgroundColor: 'rgba(6, 182, 212, 0.1)',
  borderLeft: '4px solid $accent',
  padding: '20px',
  borderRadius: '0 12px 12px 0',
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-start',
  color: '$textMain',
  fontSize: '1rem',
  lineHeight: 1.6
});

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function ProfileSetup() {
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    displayName: user?.name || user?.nickname || user?.email || '',
    avatarUrl: user?.picture || '',
    about: 'Available',
    techDiscipline: 'Fullstack',
    githubProfile: '',
    linkedinProfile: '',
    portfolioUrl: '',
    verificationProof: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const token = await getAccessTokenSilently();
      const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const data = await uploadRes.json();
      setFormData(prev => ({ ...prev, avatarUrl: data.fileUrl }));
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getAccessTokenSilently();
        const res = await fetch(`${BACKEND_URL}/api/users/sync`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: user.email,
            displayName: user.name || user.nickname || user.email,
            avatarUrl: user.picture,
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.hasCompletedProfile) {
            navigate('/dashboard', { replace: true });
            return;
          }
          
          setFormData(prev => ({
            ...prev,
            displayName: data.displayName || prev.displayName,
            avatarUrl: data.avatarUrl || prev.avatarUrl,
            about: data.about || prev.about,
            techDiscipline: data.techDiscipline || prev.techDiscipline,
            githubProfile: data.githubProfile || '',
            linkedinProfile: data.linkedinProfile || '',
            portfolioUrl: data.portfolioUrl || '',
            verificationProof: data.verificationProof || ''
          }));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setIsFetching(false);
      }
    };
    
    if (user) {
      fetchProfile();
    }
  }, [getAccessTokenSilently, user, navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      setError("Display Name is required.");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${BACKEND_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          hasCompletedProfile: true
        })
      });

      if (!res.ok) throw new Error("Failed to save profile");

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setError("An error occurred while saving your profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return (
      <PageContainer style={{ flexDirection: 'column', gap: '20px' }}>
        <SpinningLoader size={48} color="var(--colors-accent)" />
        <h2 style={{ color: 'var(--colors-textMain)', margin: 0, fontWeight: '500' }}>Preparing your profile...</h2>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <FormContainer as="form" onSubmit={handleSubmit}>
        <Header>
          <Title><ShieldCheck size={42} color="var(--colors-accent)" /> Welcome to DevSup!</Title>
          <Subtitle>Let's build your developer identity. This helps others know who they're talking to and verifies your tech credibility.</Subtitle>
        </Header>

        <FormContent>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <img 
                src={formData.avatarUrl || 'https://via.placeholder.com/120'} 
                alt="Profile Avatar" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', border: '4px solid var(--colors-surface)' }}
              />
              <div 
                style={{ position: 'absolute', bottom: '0px', right: '0px', backgroundColor: 'var(--colors-accent)', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)', transition: 'transform 0.2s' }}
                onClick={() => fileInputRef.current?.click()}
                title="Change Avatar"
              >
                {isUploadingAvatar ? <SpinningLoader size={16} color="#fff" /> : <Camera size={16} color="#fff" />}
              </div>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarChange} />
            </div>
            <span style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--colors-textMuted)' }}>Profile Photo</span>
          </div>

          <Section>
            <SectionTitle><UserIcon size={24} /> Essential Info</SectionTitle>
            <InputGroup>
              <Label>Display Name *</Label>
              <Input 
                name="displayName" 
                value={formData.displayName} 
                onChange={handleChange} 
                placeholder="e.g. Jane Doe"
                required
              />
            </InputGroup>
            
            <InputGroup>
              <Label>Tech Discipline</Label>
              <Select name="techDiscipline" value={formData.techDiscipline} onChange={handleChange}>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Fullstack">Fullstack</option>
                <option value="UI/UX">UI/UX</option>
                <option value="DevOps">DevOps</option>
                <option value="Data">Data</option>
              </Select>
            </InputGroup>

            <InputGroup>
              <Label>About You (Short Bio)</Label>
              <Input 
                name="about" 
                value={formData.about} 
                onChange={handleChange} 
                placeholder="I love building scalable web apps..."
              />
            </InputGroup>
          </Section>

          <Section>
            <SectionTitle><Code2 size={24} /> Verification & Portfolio</SectionTitle>
            <InfoBox>
              <ShieldCheck size={28} color="var(--colors-accent)" style={{ flexShrink: 0 }} />
              <div>
                To maintain a high-quality community, we encourage providing links to your past work or profiles. This acts as proof of your skills and builds trust.
              </div>
            </InfoBox>

            <InputGroup>
              <Label>GitHub Profile URL</Label>
              <div style={{ position: 'relative' }}>
                <Code2 size={20} style={{ position: 'absolute', left: '20px', top: '17px', color: 'var(--colors-textMuted)' }} />
                <Input 
                  name="githubProfile" 
                  value={formData.githubProfile} 
                  onChange={handleChange} 
                  placeholder="https://github.com/username"
                  style={{ paddingLeft: '56px' }}
                />
              </div>
            </InputGroup>

            <InputGroup>
              <Label>LinkedIn Profile URL</Label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={20} style={{ position: 'absolute', left: '20px', top: '17px', color: 'var(--colors-textMuted)' }} />
                <Input 
                  name="linkedinProfile" 
                  value={formData.linkedinProfile} 
                  onChange={handleChange} 
                  placeholder="https://linkedin.com/in/username"
                  style={{ paddingLeft: '56px' }}
                />
              </div>
            </InputGroup>

            <InputGroup>
              <Label>Portfolio / Website</Label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={20} style={{ position: 'absolute', left: '20px', top: '17px', color: 'var(--colors-textMuted)' }} />
                <Input 
                  name="portfolioUrl" 
                  value={formData.portfolioUrl} 
                  onChange={handleChange} 
                  placeholder="https://yourwebsite.com"
                  style={{ paddingLeft: '56px' }}
                />
              </div>
            </InputGroup>

            <InputGroup>
              <Label>Additional Verification (Any other proof of experience)</Label>
              <TextArea 
                name="verificationProof" 
                value={formData.verificationProof} 
                onChange={handleChange} 
                placeholder="I've worked on XYZ project, here is the link... Or simply outline your top 3 achievements."
              />
            </InputGroup>
          </Section>

          {error && <div style={{ color: 'var(--colors-danger)', fontSize: '1.05rem', textAlign: 'center' }}>{error}</div>}
        </FormContent>

        <Footer>
          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? <SpinningLoader size={20} /> : <CheckCircle size={20} />}
            {isSubmitting ? 'Saving...' : 'Complete Profile'}
          </SubmitButton>
        </Footer>
      </FormContainer>
    </PageContainer>
  );
}

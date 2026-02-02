import React, { useState } from 'react';
import {
  Card,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Stack,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  Share as ShareIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  QrCode2 as QrCodeIcon,
  Launch as LaunchIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import {
  copyToClipboard,
  copyLinkToClipboard,
  getWhatsAppShareUrl,
  getEmailShareUrl,
  generateQRCode,
  generatePortalLink,
  shareVia,
} from '../utils/invitationCodeShare';

interface PortalInvitationCardProps {
  invitationCode: string;
  isActive: boolean;
  organizationName: string;
}

export const PortalInvitationCard: React.FC<PortalInvitationCardProps> = ({
  invitationCode,
  isActive,
  organizationName,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const portalLink = generatePortalLink(invitationCode);
  const qrCodeUrl = generateQRCode(invitationCode);

  const handleCopyCode = async () => {
    const success = await copyToClipboard(invitationCode);
    if (success) {
      setCopied(true);
      setCopySuccess(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyLinkToClipboard(invitationCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setShareMenuAnchor(event.currentTarget);
  };

  const handleShareMenuClose = () => {
    setShareMenuAnchor(null);
  };

  const handleShareWhatsApp = () => {
    const url = getWhatsAppShareUrl({ invitationCode, organizationName });
    window.open(url, '_blank');
    handleShareMenuClose();
  };

  const handleShareEmail = () => {
    const url = getEmailShareUrl({ invitationCode, organizationName });
    window.location.href = url;
    handleShareMenuClose();
  };

  const handleShareNative = async () => {
    const success = await shareVia({ invitationCode, organizationName });
    if (success) {
      handleShareMenuClose();
    }
  };

  const handleQrOpen = () => {
    setQrOpen(true);
  };

  const handleQrClose = () => {
    setQrOpen(false);
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${organizationName}-invitation-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {copySuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✓ Copied to clipboard!
        </Alert>
      )}

      <Card sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ color: 'white' }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                🔐 Portal Invitation Code
              </Typography>
              {isActive ? (
                <Chip label="Active" icon={<CheckIcon />} color="success" variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'white' }} />
              ) : (
                <Chip label="Inactive" color="error" variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} />
              )}
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Share this code with bidders to access your auction portal
            </Typography>
          </Box>

          {/* Invitation Code Display */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                value={invitationCode}
                disabled
                size="small"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.7)',
                    },
                  },
                  '& .MuiOutlinedInput-input:disabled': {
                    WebkitTextFillColor: 'white',
                  },
                }}
              />
              <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
                <IconButton
                  size="small"
                  onClick={handleCopyCode}
                  sx={{
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  {copied ? <CheckIcon /> : <ContentCopyIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Portal Link */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
              Portal Link:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                value={portalLink}
                disabled
                size="small"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.7)',
                    },
                  },
                  '& .MuiOutlinedInput-input:disabled': {
                    WebkitTextFillColor: 'white',
                  },
                }}
              />
              <Tooltip title="Copy link">
                <IconButton
                  size="small"
                  onClick={handleCopyLink}
                  sx={{
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Open link">
                <IconButton
                  size="small"
                  onClick={() => window.open(portalLink, '_blank')}
                  sx={{
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <LaunchIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<QrCodeIcon />}
              onClick={handleQrOpen}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              QR Code
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<ShareIcon />}
              onClick={handleShareMenuOpen}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              Share
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* Share Menu */}
      <Menu anchorEl={shareMenuAnchor} open={Boolean(shareMenuAnchor)} onClose={handleShareMenuClose}>
        <MenuItem onClick={handleShareWhatsApp}>
          <WhatsAppIcon sx={{ mr: 2, color: '#25D366' }} />
          WhatsApp
        </MenuItem>
        <MenuItem onClick={handleShareEmail}>
          <EmailIcon sx={{ mr: 2, color: '#EA4335' }} />
          Email
        </MenuItem>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <MenuItem onClick={handleShareNative}>
            <ShareIcon sx={{ mr: 2 }} />
            Native Share
          </MenuItem>
        )}
      </Menu>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onClose={handleQrClose} maxWidth="sm" fullWidth>
        <DialogTitle>Portal Invitation QR Code</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Scan this QR code to access the portal
          </Typography>
          <Box
            component="img"
            src={qrCodeUrl}
            alt="QR Code"
            sx={{
              maxWidth: '100%',
              width: '300px',
              height: '300px',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
            }}
          />
          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
            Invitation Code: {invitationCode}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDownloadQR} color="primary" variant="contained">
            Download QR Code
          </Button>
          <Button onClick={handleQrClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

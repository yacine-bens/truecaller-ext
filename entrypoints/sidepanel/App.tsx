import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { useEffect, useRef, useState } from 'react';
import { Box, Button, SlideProps, Slide, Tab, Tabs, TextField, Snackbar, Alert, CircularProgress, List, ListItem, ListItemAvatar, Avatar, ListItemText } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import WcIcon from '@mui/icons-material/Wc';
import InfoIcon from '@mui/icons-material/Info';
import PhoneIcon from '@mui/icons-material/Phone';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import { getUserInfo, searchNumber, sendOTP, verifyOTP } from '@/entrypoints/sidepanel/truecaller/truecaller';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <>{children}</>
      )}
    </div>
  );
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

function App() {
  const [tabIndex, setTabIndex] = useState(0);

  const [installationPhone, setInstallationPhone] = useState<Record<string, any>>({});
  const [installationId, setInstallationId] = useState('');
  const [phone, setPhone] = useState<Record<string, any>>({});
  const [OTP, setOTP] = useState('');
  const [requestId, setRequestId] = useState('');

  const [userInfo, setUserInfo] = useState<Record<string, any>>({});

  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [snackbarAlert, setSnackbarAlert] = useState({} as any);

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setIsSnackbarOpen(false);
  };

  const showAlert = (severity: ('error' | 'info' | 'success' | 'warning'), msg: string, duration?: number | null, icon?: ('circular-progress')) => {
    setSnackbarAlert({ severity, msg, duration, icon });
    setIsSnackbarOpen(true);
  };

  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [requestId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleInstallationPhoneChange = (value: string, country: Record<string, any>, event: any, formattedValue: string) => {
    setInstallationPhone({ value, country });
  };

  const handlePhoneChange = (value: string, country: Record<string, any>, event: any, formattedValue: string) => {
    setPhone({ value, country });
  };

  const handleRequestOTP = async () => {
    const phoneNumber = {
      regionCode: installationPhone.country.countryCode.toUpperCase(),
      countryCode: parseInt(installationPhone.country.dialCode),
      number: installationPhone.value.slice(installationPhone.country.dialCode.length)
    };

    showAlert('info', 'Requesting OTP...', null, 'circular-progress');
    const response = await sendOTP(phoneNumber);
    console.log(response);

    if (!response.status) {
      showAlert('error', response.message);
      return;
    }

    showAlert('success', 'OTP sent successfully', 3000);
    setRequestId(response.requestId);
  };

  const handleVerifyOTP = async () => {
    const phoneNumber = {
      regionCode: installationPhone.country.countryCode.toUpperCase(),
      countryCode: parseInt(installationPhone.country.dialCode),
      number: installationPhone.value.slice(installationPhone.country.dialCode.length)
    };

    showAlert('info', 'Verifying OTP...', null, 'circular-progress');
    const response = await verifyOTP(requestId, phoneNumber, OTP);
    console.log(response);

    if (!response.status) {
      showAlert('error', response.message);
      return;
    }

    showAlert('success', 'OTP verified successfully', 3000);
    setInstallationId(response.installationId);
  };

  const handleSave = async () => {
    await chrome.storage.local.set({ installationPhone, installationId });
    showAlert('success', 'Saved successfully', 3000);
  };

  const handleSearch = async () => {
    if (!installationId) {
      showAlert('error', 'Please enter Installation ID');
      return;
    }

    const phoneNumber = {
      regionCode: phone.country.countryCode.toUpperCase(),
      countryCode: parseInt(phone.country.dialCode),
      number: phone.value.slice(phone.country.dialCode.length)
    };

    showAlert('info', 'Searching...', null, 'circular-progress');
    const response = await searchNumber(phoneNumber, installationId);
    console.log(response);

    if (!response.status || !response.data.data) {
      showAlert('error', response.message || response.data.message);
      return;
    }

    showAlert('success', 'Search successful', 3000);
    const info = getUserInfo(response.data.data[0]);
    setUserInfo(info);
  };

  useEffect(() => {
    (async () => {
      const { installationPhone: installationPhoneStorage, installationId: installationIdStorage } = await chrome.storage.local.get(['installationPhone', 'installationId']);
      setInstallationPhone(installationPhoneStorage || {});
      setInstallationId(installationIdStorage || '');
    })();
  }, []);

  return (
    <Box>
      <Box>
        <Tabs value={tabIndex} onChange={handleTabChange} >
          <Tab label='Search' icon={<SearchIcon />} iconPosition='start' sx={{ width: '50%' }} />
          <Tab label='Settings' icon={<SettingsIcon />} iconPosition='start' sx={{ width: '50%' }} />
        </Tabs>
      </Box>
      <CustomTabPanel value={tabIndex} index={0}>
        <Box margin={1.5}>
          <Grid container rowSpacing={2} columnSpacing={1} columns={1}>
            <Grid xs={1}>
              <PhoneInput
                country='dz'
                onlyCountries={['dz']}
                masks={{ dz: '(.) .. .. .. ..' }}
                value={phone.value}
                onChange={handlePhoneChange}
                disableDropdown
                countryCodeEditable={false}
                isValid={(value, country: any) => parseInt(value.slice(country.dialCode.length)[0]) == 0 ? 'Please remove "0"' : true}
                inputStyle={{ width: '100%' }}
              />
            </Grid>
            <Grid xs={1}>
              <Button variant='contained' fullWidth onClick={handleSearch} sx={{ padding: '.75rem' }} startIcon={<SearchIcon />}>Search</Button>
            </Grid>
            <Grid xs={1}>
              {Object.keys(userInfo).length > 0 &&
                <List disablePadding>
                  <ListItem disablePadding>
                    <ListItemAvatar>
                      {!!userInfo.image ? <Avatar alt={userInfo.name} src={userInfo.image} /> :
                        <Avatar>
                          {userInfo.name.split(' ').map((n: string) => n[0].toUpperCase()).join('')}
                        </Avatar>
                      }
                    </ListItemAvatar>
                    <ListItemText secondary="Name" primary={userInfo.name} />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemAvatar>
                      <Avatar>
                        <WcIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText secondary="Gender" primary={userInfo.gender} />
                  </ListItem>
                  {!!userInfo.about && <ListItem disablePadding>
                    <ListItemAvatar>
                      <Avatar>
                        <InfoIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText secondary="About" primary={userInfo.about} />
                  </ListItem>}
                  {!!userInfo.internetAddresses.length && <ListItem disablePadding>
                    <ListItemAvatar>
                      <Avatar>
                        <AlternateEmailIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText secondary="Emails" primary={userInfo.internetAddresses.map((a: any) => a.id).join(' | ')} />
                  </ListItem>}
                  {userInfo.phones.length > 1 && <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <PhoneIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText secondary="Phones" primary={userInfo.phones.map((a: any) => a.id).join(' | ')} />
                  </ListItem>}
                </List>
              }
            </Grid>
          </Grid>
        </Box>
      </CustomTabPanel>
      <CustomTabPanel value={tabIndex} index={1}>
        <Box margin={1.5}>
          <Grid container rowSpacing={2} columnSpacing={1} columns={2}>
            <Grid xs={2}>
              <PhoneInput country='us'
                value={installationPhone.value}
                onChange={handleInstallationPhoneChange}
                regions={['america', 'asia', 'oceania', 'africa', 'europe']}
                specialLabel='Installation Phone'
                enableSearch
                inputStyle={{ width: '100%' }}
              />
            </Grid>
            {/* <Grid xs={2}>
              <TextField fullWidth autoComplete='off' variant='outlined' label='Request ID' onChange={(e) => setRequestId(e.target.value)} placeholder='Enter Request ID' value={requestId} disabled />
            </Grid> */}
            <Grid xs={2}>
              <TextField ref={otpInputRef} fullWidth autoComplete='off' variant='outlined' label='OTP' onChange={(e) => setOTP(e.target.value)} placeholder='Please Enter OTP' value={OTP} disabled={!requestId} />
            </Grid>
            <Grid xs={1}>
              <Button
                fullWidth
                disabled={!installationPhone.value}
                variant='contained'
                onClick={handleRequestOTP}
              >
                Request OTP
              </Button>
            </Grid>
            <Grid xs={1}>
              <Box sx={{ position: 'relative' }}>
                <Button
                  fullWidth
                  disabled={!OTP || !requestId}
                  variant='contained'
                  onClick={handleVerifyOTP}
                >
                  Verify OTP
                </Button>
              </Box>
            </Grid>
            <Grid xs={2}>
              <TextField fullWidth autoComplete='off' variant='outlined' label='Installation ID' onChange={(e) => setInstallationId(e.target.value)} placeholder='Enter Installation ID' value={installationId} />
            </Grid>
            <Grid xs={2}>
              <Button variant='contained' fullWidth onClick={handleSave} sx={{ padding: '.75rem' }} startIcon={<SaveIcon />} disabled={!installationId}>Save</Button>
            </Grid>
          </Grid>
        </Box>
      </CustomTabPanel>

      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={snackbarAlert.duration}
        onClose={handleSnackbarClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbarAlert.severity}
          variant='filled'
          sx={{ width: '100%' }}
          onClose={handleSnackbarClose}
          icon={snackbarAlert.icon === 'circular-progress' ? <CircularProgress size={24} color='inherit' /> : null}
        >
          {snackbarAlert.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;

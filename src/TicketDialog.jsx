import {
  Box,
  Button,
  Dialog,
  dialogClasses,
  FormControl,
  InputLabel,
  MenuItem,
  outlinedInputClasses,
  Select,
  TextField,
  Typography
} from "@mui/material";
import { toast } from 'sonner';
import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase.js";
import useParkingLotId from './useParkingLotId.js';

const defaultTimeInterval = 7200000;

const TicketDialog = ({ intervals, onClose, onSuccess, ticket, type }) => {
  const licenseNoRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const [timeInterval, setTimeInterval] = useState(ticket?.interval || intervals[0].value);
  const [licenseNo, setLicenseNo] = useState(ticket?.license_no || '');
  const [error, setError] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  const parkingLotId = useParkingLotId(user?.id);

  useEffect(() => {
    if (licenseNo.length >= 7) {
      setError(false);
    } else {
      if (hasSubmittedRef.current) {
        setError(true);
      }
    }
  }, [licenseNo])

  const handleSubmit = async () => {
    hasSubmittedRef.current = true;

    if (licenseNo.length < 7) {
      setError(true);
      licenseNoRef.current?.focus();

      return;
    }

    if (timeInterval && licenseNo) {
      setError(false);

      const payload = { interval: timeInterval, license_no: licenseNo, parking_lot_id: parkingLotId };

      let data;

      if (type === 'add') {
        data = (
          await supabase
            .from('tickets')
            .insert(payload)
            .select()
        ).data;
      } else {
        data = (
          await supabase
            .from('tickets')
            .update(payload)
            .eq('id', ticket.id)
            .select()
        ).data;
      }

      if (data) {
        const [ticket] = data;

        if (ticket) {
          onSuccess(ticket);

          toast.success(`Tichet ${type === 'add' ? 'adăugat' : 'modificat'} (${payload.license_no})`);
        } else {
          toast.error('Tichetul nu a putut fi adăugat');
        }
      }

      setLicenseNo('');
      setTimeInterval(defaultTimeInterval);
      onClose();
    }
  };

  useEffect(() => {
    setTimeout(() => {
      licenseNoRef.current?.focus();
    });
  }, [])

  return (
    <Dialog
      open
      onClose={onClose}
      sx={{
        [`& .${dialogClasses.paper}`]: {
          width: 350,
          height: 430,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        },
      }}
    >
      <Box
        width={250}
        display='flex'
        flexDirection='column'
        justifyContent='center'
      >
        <Typography variant='h5' sx={{ mb: 4 }}>
          {type === 'add' ? 'Adaugă tichet' : 'Modifică tichet'}
        </Typography>
        <FormControl className='flex gap-5'>
          <InputLabel id='select'>
            Interval
          </InputLabel>
          <Select
            value={timeInterval}
            onChange={(ev) => setTimeInterval(+ev.target.value)}
            label='Interval'
            labelId='select'
            variant='outlined'
            sx={{ width: '100%' }}
          >
            {intervals.map(({ name, value }) => (
              <MenuItem
                key={value}
                value={value}
              >
                {name}
              </MenuItem>
            ))}
          </Select>
          <Box width={1}>
            <TextField
              inputRef={licenseNoRef}
              value={licenseNo}
              onChange={(ev) => setLicenseNo(ev.target.value)}
              onKeyDown={(ev) => ev.key === 'Enter' && handleSubmit()}
              color={error ? 'error' : 'primary'}
              variant='outlined'
              label='Număr de înmatriculare'
              sx={{ [`& .${outlinedInputClasses.root}`]: { background: 'white' }, width: '100%' }}
            />
            <Box display='flex' justifyContent='center' mt={1} height={24}>
              {error && (
                <Typography color='error' variant='body2'>
                  Numărul de înmatriculare este invalid
                </Typography>
              )}
            </Box>
          </Box>
          <Button
            onClick={handleSubmit}
            variant='contained'
            sx={{ mt: 2 }}
            disabled={error}
          >
            Confirmă
          </Button>
          <Button
            onClick={onClose}
            variant='text'
            color='error'
          >
            Anulează
          </Button>
        </FormControl>
      </Box>
    </Dialog>
  );
}

export default TicketDialog;

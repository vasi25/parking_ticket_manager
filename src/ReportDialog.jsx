import {
  Box,
  Button,
  Dialog,
  FormControl,
  Typography,
  dialogClasses,
} from "@mui/material";
import dayjs from './dayjs';
import 'dayjs/locale/ro'
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {useState} from "react";

const ReportDialog = ({ onSubmit, onClose }) => {
  const [ startDate, setStartDate ] = useState(dayjs(Date.now()));
  const [ endDate, setEndDate ] = useState(dayjs(Date.now()));

  const handleSubmit = async() => {
    if (startDate && endDate) {
      onSubmit(startDate.startOf('day'), endDate.endOf('day'));
      onClose();
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      sx={{
        [`& .${dialogClasses.paper}`]: {
          width: 350,
          height: 432,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        },
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='ro'>
        <Box width={250} display='flex' flexDirection='column' justifyContent='center'>
          <Typography variant='h5' sx={{ mb: 4 }}>
            Extrage raport
          </Typography>
          <FormControl className='flex gap-5'>
            <DatePicker
              label="De la"
              value={startDate}
              onChange={(value) => setStartDate(dayjs.tz(value))}
            />
            <DatePicker
              label="Până la"
              value={endDate}
              onChange={(value) => setEndDate(dayjs.tz(value))}
            />
            <Button
              onClick={handleSubmit}
              variant='contained'
              sx={{ mt: 6 }}
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
      </LocalizationProvider>
    </Dialog>
  );
};

export default ReportDialog;

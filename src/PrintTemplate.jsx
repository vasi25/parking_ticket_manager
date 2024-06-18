import {Box, Typography} from "@mui/material";
import dayjs from './dayjs';

const dateFormat = 'DD.MM.YYYY - HH:mm';

const PrintTemplate = ({ ticket, intervals }) => {
  return (
    <Box color='black' p={5}>
      <Typography>
        <b>AEROPARK S.R.L.</b>
      </Typography>
      <Typography>
        CUI: 47733385
      </Typography>
      <Typography>
        J16/503/01.03.2023
      </Typography>
      <Typography>
        Sat Albești, Comuna Șimnicu de Sus, Str. COL. JOAN ANGELESCU, Nr. 65E, Județ Dolj
      </Typography>
      <Box display='flex' gap={2}>
        <Typography>Serie / număr:</Typography>
        <Typography><b>APK</b> / <b>{ticket.id}</b></Typography>
      </Box>
      <br />
      <hr />
      <Box
        display='flex'
        gap={2}
        mt={2}
      >
        <Typography>Număr înmatriculare:</Typography>
        <Typography>
          <b>{ticket.license_no.toUpperCase()}</b>
        </Typography>
      </Box>
      <Box display='flex' gap={2}>
        <Typography>Data și ora întrării:</Typography>
        <Typography>
          <b>{dayjs(new Date(ticket.created_at)).format(dateFormat)}</b>
        </Typography>
      </Box>
      <Box display='flex' gap={2}>
        <Typography>Data și ora ieșirii:</Typography>
        <Typography>
          <b>{dayjs(new Date(new Date(ticket.created_at).valueOf() + ticket.interval)).format(dateFormat)}</b>
        </Typography>
      </Box>
      <Box display='flex' gap={2}>
        <Typography>Timp alocat (ore):</Typography>
        <Typography><b>{+ticket.interval / (1000 * 60 * 60)}</b></Typography>
      </Box>
      <Box display='flex' gap={2}>
        <Typography>Tarif:</Typography>
        <Typography><b>{intervals.find(({ value }) => value === ticket.interval)?.cost}</b></Typography>
      </Box>
    </Box>
  );
};

export default PrintTemplate;

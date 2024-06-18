import { useRef, useEffect, useState } from "react";
import { toast } from 'sonner';
import {
  Stack,
  Button,
  Box,
  Container,
  TextField,
  outlinedInputClasses,
  textFieldClasses,
  formControlClasses,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import PrintIcon from "@mui/icons-material/Print";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { supabase } from './supabase.js';
import ReportDialog from './ReportDialog.jsx';
import TicketDialog from './TicketDialog.jsx';
import TicketCard from "./TicketCard.jsx";
import dayjs from "./dayjs";
import { useReactToPrint } from "react-to-print";
import useUserRole from './useUserRoles.js';
import useParkingLotId from './useParkingLotId.js';
import useParkingSpots from './useParkingSpots.js';

const utcOffset = 10800000;

const intervals = [
  {
    name: '1 oră / 3 lei',
    value: 3600000,
    cost: '3,00 lei',
  },
  {
    name: '2 ore / 6 lei',
    value: 7200000,
    cost: '6,00 lei',
  },
  {
    name: '3 ore / 9 lei',
    value: 10800000,
    cost: '9,00 lei',
  },
  {
    name: '4 ore / 12 lei',
    value: 14400000,
    cost: '12,00 lei',
  },
  {
    name: '5 ore / 15 lei',
    value: 18000000,
    cost: '15,00 lei',
  },
  {
    name: '8 ore / 20 lei',
    value: 28800000,
    cost: '20,00 lei',
  },
  {
    name: '12 ore / 30 lei',
    value: 43200000,
    cost: '30,00 lei',
  },
  {
    name: '24 ore / 40 lei',
    value: 86400000,
    cost: '40,00 lei',
  },
  {
    name: '4 zile / 100 lei',
    value: 345600000,
    cost: '100,00 lei',
  },
  {
    name: '7 zile / 150 lei',
    value: 604800000,
    cost: '150,00 lei',
  },
  {
    name: '1 lună / 350 lei',
    value: 2419200000,
    cost: '350,00 lei',
  },
];

const dateDisplayFormat = 'DD.MM.YYYY - HH:mm';
const dateDbFormat = 'YYYY-MM-DDTHH:mm:ss';

export default function Dashboard() {
  const ticketsScrollRef = useRef();
  const reportsRef = useRef();
  const [user, setUser] = useState(null);
  const role = useUserRole(user?.id);
  const parkingLotId = useParkingLotId(user?.id);
  const parkingSpots = useParkingSpots(parkingLotId);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportsInterval, setReportsInterval] = useState({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredActiveTickets, setFilteredActiveTickets] = useState(tickets);
  const [showReports, setShowReports] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sort, setSort] = useState(localStorage.getItem('sortBy') || 'recent');
  const [availableSpots, setAvailableSpots] = useState(parkingSpots);

  const handlePrintReport = useReactToPrint({
    content: () => reportsRef?.current
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    ticketsScrollRef.current?.scrollTo(0, 0);
  }, [sort]);

  const fetchTickets = async (parkingLotId, setTickets) => {
    try {
      console.log("Fetching tickets for parking lot ID:", parkingLotId);
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('parking_lot_id', parkingLotId)
        .is('leave_at', null);

      if (error) {
        throw error;
      }

      console.log("Tickets fetched:", data);
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  useEffect(() => {
    if (!showReports && parkingLotId) {
      fetchTickets(parkingLotId, setTickets);
    }
  }, [showReports, parkingLotId]);

  useEffect(() => {
    setFilteredActiveTickets(() => (
      tickets.filter(({ license_no, parking_lot_id }) => (
        license_no.toLowerCase().includes(searchKeyword.toLowerCase()) &&
        parking_lot_id === parkingLotId
      ))
        .sort((a, b) => {
          if (sort === 'expiration') {
            const currentTime = Date.now();
            const createdAtA = new Date(a.created_at).getTime();
            const createdAtB = new Date(b.created_at).getTime();

            const remainingTimeA = createdAtA + a.interval - currentTime;
            const remainingTimeB = createdAtB + b.interval - currentTime;

            return remainingTimeA > remainingTimeB ? 1 : -1;
          }

          return a.created_at > b.created_at ? -1 : 1;
        })
    ));
  }, [tickets, searchKeyword, sort, parkingLotId]);

  useEffect(() => {
    const updateAvailableSpots = () => {
      if (!parkingSpots) return;
      const available = parkingSpots - tickets.length;
      setAvailableSpots(available >= 0 ? available : 0);
    };

    if (parkingLotId) {
      fetchTickets(parkingLotId, setTickets);
      updateAvailableSpots();
    }
  }, [parkingLotId, parkingSpots, tickets]);

  const handleTicketAdd = (data) => {
    setTickets((activeTickets) => ([data, ...activeTickets]));

    if (sort === 'recent') {
      ticketsScrollRef.current?.scrollTo(0, 0);
    }

    setSearchKeyword('');
  };

  const handleTicketUpdate = (data) => {
    setTickets((activeTickets) => ([data, ...activeTickets.filter(({ id }) => id !== data.id)]));
  }

  const handleReports = async (startDate, endDate) => {
    setIsLoading(true);
    setShowReports(true);

    if (!parkingLotId) {
      setIsLoading(false);
      console.error('Parking Lot ID is not available');
      return;
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .gte('created_at', startDate.format(dateDbFormat))
      .lte('created_at', endDate.format(dateDbFormat))
      .eq('parking_lot_id', parkingLotId)
      .order('created_at');

    if (error) {
      console.error('Error fetching reports:', error);
      setIsLoading(false);
      return;
    }

    setReports(data);
    setReportsInterval({ startDate, endDate });
    setIsLoading(false);
    setSearchKeyword('');
  };

  const handleSessionEnd = async (ticketId) => {
    const { data } = await supabase
      .from('tickets')
      .update({ leave_at: new Date(Date.now() + utcOffset).toISOString() })
      .eq('id', ticketId)
      .select('*')

    if (data) {
      setTickets((activeTickets) => activeTickets.filter(({ id }) => id !== ticketId));
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      setSession(null);
      console.log('Successfully logged out');
    }
  };

  const handleAddClick = () => {
    if (availableSpots === 0) {
      toast.error('Nu mai sunt locuri de parcare disponibile');
    } else {
      setAddDialogOpen(true);
    }
  };

  return (
    <div className='flex h-screen bg-slate-100 flex flex-col items-center'>
      <Box
        width={1}
        px={10}
        py={2}
        minHeight='72px'
        className='bg-black'
      >
        <Container
          maxWidth='xl'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          {showReports ? (
            <>
              <Button
                onClick={() => {
                  setShowReports(false);
                  setReportsInterval({})
                  setReports([]);
                }}
                variant='contained'
                sx={{ pl: 1 }}
              >
                <ChevronLeftIcon />
                Înapoi
              </Button>
              <Button
                onClick={() => setReportDialogOpen(true)}
                variant='outlined'
              >
                Modifică intervalul
              </Button>
            </>
          ) : (
            <>
              {role === 'desktop' && (
                <>
                  <TextField
                    value={searchKeyword}
                    label='Filtrează'
                    size='small'
                    onChange={(ev) => setSearchKeyword(ev.target.value)}
                    sx={{
                      [`&.${formControlClasses.root}.${textFieldClasses.root}`]: {
                        mb: 0,
                      },
                      [`& .${outlinedInputClasses.root}`]: {
                        width: 272,
                        background: 'white'
                      },
                      mb: 1.5
                    }}
                  />
                </>
              )}
              <Box display='flex' gap={2}>
                {role === 'desktop' && (
                  <>
                    <Button
                      onClick={() => setReportDialogOpen(true)}
                      variant='outlined'
                    >
                      Raport
                    </Button>
                  </>
                )}
                {role === 'mobile' && (
                  <>
                    <Button
                      onClick={handleAddClick}
                      variant='contained'
                      sx={{ width: 'fit-content' }}
                    >
                      Adaugă
                    </Button>
                  </>
                )}
                <Button
                  onClick={handleLogout}
                  variant='contained'
                  sx={{
                    width: 'fit-content',
                    ml: 'auto',
                    color: 'white',
                    backgroundColor: 'red',
                    '&:hover': {
                      backgroundColor: 'darkred'
                    }
                  }}
                >
                  Logout
                </Button>
              </Box>
            </>
          )}
        </Container>
      </Box>
      <Box
        display='flex'
        alignItems='center'
        flexDirection='column'
        width={1}
        sx={{ overflow: 'hidden' }}
      >
        <Box
          py={3}
          width={1}
          display='flex'
          justifyContent='center'
          sx={{ color: 'black' }}
          className='bg-slate-200'
        >
          {showReports ? (
            <Box display='flex' alignItems='center' gap={2} position='relative'>
              <AssessmentIcon sx={{ position: 'absolute', left: -40 }} />
              <Typography variant='h4'>
                Raport
              </Typography>
            </Box>
          ) : (
            <Box display='flex' alignItems='center' gap={2} position='relative'>
              <ConfirmationNumberIcon sx={{ position: 'absolute', left: -40 }} />
              <Typography variant='h4'>
                Tichete
              </Typography>
            </Box>
          )}
        </Box>
        {isLoading ? (
          <Box
            display='flex'
            flexDirection='column'
            justifyContent='center'
            alignItems='center'
            height={1}
            gap={3}
            mt={30}
          >
            <CircularProgress />
          </Box>
        ) : (
          showReports ? (
            reports.length ? (
              <>
                <Box
                  display='flex'
                  alignItems='center'
                  pt={3.5}
                  pb={3.5}
                  sx={{ color: 'black' }}
                  gap={8}
                >
                  <Box
                    display='flex'
                    gap={1}
                  >
                    <Typography>
                      Interval:
                    </Typography>
                    <Typography>
                      <b>{dayjs(reportsInterval.startDate).format('DD.MM.YYYY')}</b>
                      <span> - </span>
                      <b>{dayjs(reportsInterval.endDate).format('DD.MM.YYYY')}</b>
                    </Typography>
                  </Box>
                  <Box
                    display='flex'
                    gap={1}
                  >
                    <Typography>
                      Total încasări:
                    </Typography>
                    <Typography>
                      <b>
                        {reports.reduce((acc, { interval }) => {
                          const { cost } = intervals.find(({ value }) => value === +interval);

                          return acc + (+cost.slice(0, cost.indexOf(',')));
                        }, 0)} lei
                      </b>
                    </Typography>
                  </Box>
                  <IconButton
                    color='primary'
                    onClick={handlePrintReport}
                    sx={{ height: 48, width: 48 }}
                  >
                    <PrintIcon />
                  </IconButton>
                </Box>
                <Box
                  width={900}
                  pb={10}
                  sx={{ overflow: 'scroll' }}
                >
                  <TableContainer ref={reportsRef} component={Paper}>
                    <Table aria-label="simple table">
                      <TableHead>
                        <TableRow>
                          <TableCell align="left"><b>Nr.</b></TableCell>
                          <TableCell align="left"><b>Nr. înmatriculare</b></TableCell>
                          <TableCell align="right"><b>Data și ora intrării</b></TableCell>
                          <TableCell align="right"><b>Data și ora ieșirii</b></TableCell>
                          <TableCell align="right"><b>Tarif</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow
                            key={report.id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell component="th" scope="row" align="left" sx={{ width: 70 }}>{report.id}</TableCell>
                            <TableCell align="left">{report.license_no}</TableCell>
                            <TableCell align="right">{dayjs(new Date(report.created_at)).format(dateDisplayFormat)}</TableCell>
                            <TableCell align="right">{dayjs(new Date(new Date(report.created_at).valueOf() + report.interval)).format(dateDisplayFormat)}</TableCell>
                            <TableCell align="right">{intervals.find(({ value }) => value === report.interval)?.cost}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            ) : (
              <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                gap={3}
                pt={27}
                sx={{ color: 'black' }}
              >
                <Typography variant='h6'>
                  Nu există date pentru intervalul selectat
                </Typography>
                <Box display='flex' gap={1}>
                  <EventBusyIcon color='error' />
                  <Typography>
                    <b>{dayjs(reportsInterval.startDate).format('DD.MM.YYYY')}</b>
                    <span> - </span>
                    <b>{dayjs(reportsInterval.endDate).format('DD.MM.YYYY')}</b>
                  </Typography>
                </Box>
              </Box>
            )
          ) : (
            <Box
              display='flex'
              flexDirection='column'
              alignItems='center'
              position='relative'
              sx={{ overflow: 'hidden' }}
              mt={2}
            >
              <Box p={1} borderRadius={1} bgcolor={'#f0f0f0'} display="flex" alignItems="center">
                <Typography variant="body2">
                  Locuri disponibile:
                </Typography>
                <Typography variant="h6" color="primary" ml={0.5}>
                  {availableSpots} {/* Displaying the calculated available spots */}
                </Typography>
              </Box>
              <Box
                py={2}
                width={300}
                sx={{ borderBottom: '1px solid #dadddf', marginTop: '8px' }} // Adjust the marginTop value here to reduce spacing
              >
                <FormControl fullWidth>
                  <InputLabel id="sort">Sortează după</InputLabel>
                  <Select
                    labelId="sort"
                    id="sort"
                    value={sort}
                    label="Sortează după"
                    onChange={(e) => {
                      setSort(e.target.value);
                      localStorage.setItem('sortBy', e.target.value);
                    }}
                    sx={{ background: '#fff' }}
                  >
                    <MenuItem value='recent'>Cele mai recente</MenuItem>
                    <MenuItem value='expiration'>Ora expirării</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Stack
                ref={ticketsScrollRef}
                spacing={5}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'column',
                  overflow: 'scroll',
                  whiteSpace: 'nowrap',
                  pt: showReports ? 0 : 3.5,
                  pb: 10,
                  width: '100vw'
                }}
              >
                {filteredActiveTickets.map((ticket) => (
                  <TicketCard
                    intervals={intervals}
                    key={ticket.id}
                    ticket={ticket}
                    onUpdate={handleTicketUpdate}
                    onSessionEnd={handleSessionEnd}
                  />
                ))}
              </Stack>
            </Box>
          )
        )}
      </Box>
      {
        isAddDialogOpen && (
          <TicketDialog
            onClose={() => setAddDialogOpen(false)}
            onSuccess={handleTicketAdd}
            intervals={intervals}
            type='add'
          />
        )
      }
      {
        isReportDialogOpen && (
          <ReportDialog
            onClose={() => setReportDialogOpen(false)}
            onSubmit={handleReports}
          />
        )
      }
    </div >
  )
}

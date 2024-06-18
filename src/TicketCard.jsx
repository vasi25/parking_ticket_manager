import { Box, Button, Card, IconButton, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete'; // Import DeleteIcon
import PrintIcon from "@mui/icons-material/Print";
import TicketDialog from "./TicketDialog.jsx";
import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import PrintTemplate from "./PrintTemplate.jsx";
import { toast } from "sonner";
import useUserRole from './useUserRoles.js';
import { supabase } from './supabase.js';
import useParkingLotId from './useParkingLotId.js';

const TicketCard = ({ ticket, intervals, onUpdate, onSessionEnd }) => {
  const [isUpdateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const printRef = useRef(null);
  const [user, setUser] = useState(null);
  const role = useUserRole(user?.id);
  const parkingLotId = useParkingLotId(user?.id);
  const [tickets, setTickets] = useState([]);
  // console.log("Role:", role);
  const createdAt = new Date(ticket.created_at).getTime();
  const remainingTime = createdAt + ticket.interval - currentTime;
  const remainingTotalMins = Math.ceil(remainingTime > 0 ? remainingTime / (1000 * 60) : 0);
  const hours = Math.floor(remainingTotalMins / 60);
  const minutes = remainingTotalMins % 60;
  const remainingHoursLabel = hours === 1 ? 'oră' : 'ore';
  const intervalHours = +ticket.interval / (1000 * 60 * 60);
  const intervalHoursLabel = intervalHours === 1 ? 'oră' : 'ore';
  const overdueTotalMins = remainingTime < 0 ? Math.floor(Math.abs(remainingTime / (1000 * 60))) : 0;
  const overdueHours = Math.floor(overdueTotalMins / 60);
  const overdueMinutes = overdueTotalMins % 60;
  const overdueHoursLabel = overdueHours === 1 ? 'oră' : 'ore';
  const leaveAt = new Date(ticket.leave_at).getTime();
  const overtime = leaveAt - createdAt - ticket.interval;
  const overtimeTotalMins = overtime > 0 ? Math.floor(Math.abs(overtime / (1000 * 60))) : 0;
  const overtimeHours = Math.floor(overtimeTotalMins / 60);
  const overtimeMinutes = overtimeTotalMins % 60;
  const overtimeHoursLabel = overtimeHours === 1 ? 'oră' : 'ore';

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

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
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handlePrint = useReactToPrint({
    content: () => printRef.current
  });

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('tickets')  // Assuming the table name is 'tickets'
        .delete()
        .eq('id', ticket.id);  // Assuming each ticket has an 'id' field

      if (error) {
        throw error;
      }
      console.log('Ticket deleted successfully');
      fetchTickets(parkingLotId, setTickets);
    } catch (error) {
      console.error('Error deleting ticket:', error.message);
    }
  };

  return (
    <>
      <Card
        key={ticket.id}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: 300,
          minHeight: !ticket.leave_at ? 242 : 170,
          gap: .5,
          p: 2,
        }}
      >
        <Box
          display='flex'
          justifyContent='space-between'
        >
          {role == 'desktop' && (
            <>
              <Typography
                variant='h6'
                sx={{ mb: 2 }}
              >
                <b>{ticket.license_no.toUpperCase()}</b>
              </Typography>
              {!ticket.leave_at && (
                <IconButton
                  color='primary'
                  onClick={handlePrint}
                  sx={{ height: 48, width: 48 }}
                >
                  <PrintIcon />
                </IconButton>
              )}
            </>
          )}
          {role === 'mobile' && (
            <>
              <Typography
                variant='h6'
                sx={{ mb: 2 }}
              >
                <b>{ticket.license_no.toUpperCase()}</b>
              </Typography>
              {!ticket.leave_at && (
                <IconButton
                  color='error'
                  onClick={handleDelete}
                  sx={{ height: 48, width: 48 }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </>
          )}
        </Box>
        <Box display='flex' gap={2}>
          <Typography>Nr. înregistrare:</Typography>
          <Typography>{ticket.id}</Typography>
        </Box>
        <Box display='flex' gap={2}>
          <Typography>Timp alocat:</Typography>
          <Typography>{`${intervalHours} ${intervalHoursLabel}`}</Typography>
        </Box>
        <Box display='flex' gap={2}>
          {remainingTime > 0 && !ticket.leave_at ? (
            <>
              <Typography>Timp rămas:</Typography>
              <Typography color={remainingTime < 300000 ? 'error' : 'inherit'}>
                <b>{`${hours > 0 ? `${hours} ${remainingHoursLabel} ` : ''}${minutes} min`}</b>
              </Typography>
            </>
          ) : ticket.leave_at ? (
            <>
              <Typography color={overtime <= 0 ? '#15800b' : 'inherit'}>
                {`Finalizat${overtime > 0 ? ':' : ''}`}
              </Typography>
              {overtime > 0 && (
                <Typography color={overtime > 0 ? 'error' : 'success'}>
                  <b>{`(+${overtimeHours > 0 ? `${overtimeHours} ${overtimeHoursLabel} ` : ''}${overtimeMinutes} min)`}</b>
                </Typography>
              )}
            </>
          ) : (
            <>
              <Typography color='error'>
                TIMP EXPIRAT
              </Typography>
              <Typography>
                <b>{`(+${overdueHours > 0 ? `${overdueHours} ${overdueHoursLabel} ` : ''}${overdueMinutes} min)`}</b>
              </Typography>
            </>
          )}
        </Box>
        {!ticket.leave_at && (
          <Box
            display='flex'
            justifyContent='center'
            mt={3}
          >
            {role == 'mobile' && (
              <>
                <Button
                  onClick={() => setUpdateDialogOpen(true)}
                  color='warning'
                  sx={{ mt: 1.5 }}
                >
                  Modifică
                </Button>
              </>
            )}
            {role == "desktop" && (
              <>
                <Button
                  onClick={() => {
                    onSessionEnd(ticket.id);
                    toast.success(`Tichet finalizat (${ticket.license_no})`);
                  }}
                  sx={{ mt: 1.5 }}
                  variant='outlined'
                >
                  Finalizează
                </Button>
              </>
            )}
          </Box>
        )}
      </Card>
      {isUpdateDialogOpen && (
        <TicketDialog
          onClose={() => setUpdateDialogOpen(false)}
          onSuccess={onUpdate}
          intervals={intervals}
          ticket={ticket}
          type='modify'
        />
      )}
      <div
        ref={printRef}
        style={{ position: 'absolute', zIndex: -1 }}
      >
        <PrintTemplate
          ticket={ticket}
          intervals={intervals}
        />
      </div>
    </>
  );
};

export default TicketCard;

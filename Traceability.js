import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, CircularProgress, Chip, Divider,
  TextField, Paper, Alert, Autocomplete, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, List, ListItem, ListItemText, Grid
} from '@mui/material';
import {
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
  TimelineContent, TimelineDot, TimelineOppositeContent
} from '@mui/lab';
import {
  Inventory, LocalShipping, QrCode, Search, CheckCircle,
  HourglassEmpty, Comment, CalendarToday, AccessTime,
  ErrorOutline, Person, InfoOutlined
} from '@mui/icons-material';

const TraceabilityView = () => {
  const [selectedRef, setSelectedRef] = useState(null);
  const [data, setData] = useState(null);
  const [loadingTraceability, setLoadingTraceability] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [availableRefs, setAvailableRefs] = useState([]);
  const [error, setError] = useState(null);

  // Popup State
  const [openPopup, setOpenPopup] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [openFullDetails, setOpenFullDetails] = useState(false);

  useEffect(() => {
    const fetchRefList = async () => {
      try {
        const response = await axios.get("http://localhost:2000/reflist");
        setAvailableRefs(response.data?.References || []);
      } catch (err) {
        setError("Could not load reference list.");
      } finally {
        setLoadingRefs(false);
      }
    };
    fetchRefList();
  }, []);

  const fetchTraceability = async (refNo) => {
    if (!refNo) return;
    setLoadingTraceability(true);
    setError(null);
    try {
      const val = typeof refNo === 'string' ? refNo.trim() : String(refNo);
      const response = await axios.get("http://localhost:2000/traceability", { params: { ref_no: val } });
      setData(response.data);
    } catch (err) {
      setError(err.response?.status === 404 ? "Reference not found." : "Fetch failed.");
    } finally {
      setLoadingTraceability(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Logic: Calculate Lead Time (GR to UD)
  const calculateLeadTime = () => {
    if (!data?.timeline?.gr_date || !data?.timeline?.approval_date) return "N/A";
    const start = new Date(data.timeline.gr_date);
    const end = new Date(data.timeline.approval_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Days`;
  };

  const handleStepClick = (step) => {
    setPopupContent(step);
    setOpenPopup(true);
  };

  const steps = data ? [
    { label: "Material Logged", date: data.timeline.log_entry, icon: <Inventory />, details: { "PO No": data.part_info.po_no || 'N/A', "Timestamp": data.timeline.log_entry } },
    { label: "GR Created", date: data.timeline.gr_date, icon: <LocalShipping />, details: { "GR No": data.timeline.gr_no, "GR Date": data.timeline.gr_date } },
    { label: "QR Generated", date: data.timeline.qr_generated, icon: <QrCode />, details: { "Batch/Lot": data.part_info.batch_lot || 'N/A' } },
    { label: "Inspection Started", date: data.timeline.inspection_started, icon: <Search />, details: { "Started At": data.timeline.inspection_started } },
    { 
        label: "Inspection Completed", 
        date: data.timeline.inspection_submitted, 
        icon: <CheckCircle />, 
        remarks: data.timeline.inspection_remarks,
        personName: data.timeline.inspectorName,
        personId: data.timeline.inspectorID,
        details: { "Result": "Submitted", "Remarks": data.timeline.inspection_remarks }
    },
    { 
      label: `Final Decision: ${data.timeline.approval_status || 'Pending'}`, 
      date: data.timeline.approval_date, 
      icon: data.timeline.approval_status === 'Approved' ? <CheckCircle /> : <HourglassEmpty />,
      remarks: data.timeline.approver_remarks,
      personName: data.timeline.approverName,
      personId: data.timeline.approverID,
      details: { "Decision": data.timeline.approval_status, "Approver": data.timeline.approverName, "SBU": data.timeline.sbu }
    },
  ] : [];

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', py: 6, px: 2 }}>
      {/* ... Search Bar stays same ... */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Traceability Search</Typography>
        <Box sx={{ maxWidth: 700, mx: 'auto', bgcolor: 'white', p: 3, borderRadius: 3 }}>
            <Autocomplete
                freeSolo
                options={availableRefs}
                onChange={(e, val) => { setSelectedRef(val); if(val) fetchTraceability(val); }}
                renderInput={(params) => <TextField {...params} label="Reference Number" />}
            />
        </Box>
      </Box>

      {data && !loadingTraceability && (
        <Card sx={{ maxWidth: 800, mx: 'auto', borderRadius: 4 }}>
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', bgcolor: '#fafafa' }}>
            <Box>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>Material Lead Time: {calculateLeadTime()}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>PART: {data.part_info.part_number}</Typography>
              <Typography variant="body2" color="text.secondary">{data.part_info.description}</Typography>
            </Box>
            <Chip 
                label={data.reference_no} 
                color="primary" 
                onClick={() => setOpenFullDetails(true)} // Opens Full Details Dialog
                sx={{ fontWeight: 'bold', cursor: 'pointer' }} 
            />
          </Box>
          <Divider />

          <CardContent>
            <Timeline position="right">
              {steps.map((step, index) => {
                const dateObj = formatDate(step.date);
                const isCompleted = !!dateObj;
                return (
                  <TimelineItem key={index} onClick={() => isCompleted && handleStepClick(step)} sx={{ cursor: isCompleted ? 'pointer' : 'default' }}>
                    <TimelineOppositeContent color="text.secondary">
                      {isCompleted ? dateObj.toLocaleDateString() : "Pending"}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={isCompleted ? "success" : "grey"}>{step.icon}</TimelineDot>
                      {index < steps.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography fontWeight={isCompleted ? 700 : 400}>{step.label}</Typography>
                      {isCompleted && step.personName && (
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                           <Person sx={{ fontSize: 12, mr: 0.5 }} /> {step.personName}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
          </CardContent>
        </Card>
      )}

      {/* Step Details Popup */}
      <Dialog open={openPopup} onClose={() => setOpenPopup(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoOutlined color="primary" /> {popupContent?.label}
        </DialogTitle>
        <DialogContent dividers>
            <List>
                {popupContent?.details && Object.entries(popupContent.details).map(([key, val]) => (
                    <ListItem key={key}><ListItemText primary={key} secondary={val} /></ListItem>
                ))}
            </List>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenPopup(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* Full Process Details Popup (When clicking Chip) */}
      <Dialog open={openFullDetails} onClose={() => setOpenFullDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>Complete Traceability: {data?.reference_no}</DialogTitle>
        <DialogContent dividers>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Typography variant="subtitle2" color="primary">Part Info</Typography>
                    <Typography><b>Part No:</b> {data?.part_info.part_number}</Typography>
                    <Typography><b>Vendor:</b> {data?.part_info.vendor}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="subtitle2" color="primary">Process Stats</Typography>
                    <Typography><b>Total Lead Time:</b> {calculateLeadTime()}</Typography>
                    <Typography><b>Status:</b> {data?.timeline.approval_status}</Typography>
                </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            {/* You can add more detailed tables here from data */}
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenFullDetails(false)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default TraceabilityView;

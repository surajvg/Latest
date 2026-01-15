import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    FormGroup,
    TableContainer,
    Paper,
    Radio,
    RadioGroup,
    FormControlLabel,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Tabs,
    Tab,
    MenuItem,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import PhysicalForm from "./PhysicalForm";
import SubContractForm from "./SubContractForm";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CancelIcon from "@mui/icons-material/Cancel";
import SummarizeIcon from "@mui/icons-material/Summarize";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { QrCode2 } from "@mui/icons-material";
import { TaskAlt } from "@mui/icons-material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import Tooltip from "@mui/material/Tooltip";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import ElectricalForm from "./ElectricalForm";

export default function GrTestV2() {

    const [filter, setFilter] = useState("pending");
    const [tab, setTab] = useState("pending");
    const [pendingData, setPendingData] = useState([]);
    const [showExtra, setShowExtra] = useState(false);
    const [inspectionSummary, setInspectionSummary] = useState({ accepted: 0, rejected: 0 });
    // const [mechanicalSummary, setMechanicalSummary] = useState({ accepted: 0, rejected: 0 });
    const [electricalSummary, setElectricalSummary] = useState({ accepted: 0, rejected: 0 });


    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get("http://192.168.0.149:8000/generateddetails");

                const formattedData = res.data.map((item) => ({
                    slno: item.SL_No,
                    grNo: item.GR_No || "",
                    grDate: item.GR_Date ? item.GR_Date.split("T")[0] : "",
                    partNumber: item.BEL_Part_Number,
                    mpn: item.MPN,
                    batchNo: item.Batch_Lot_No,
                    dateCode: item.DateCode,
                    quantity: item.Quantity,
                    poNo: item.BEL_PO_No,
                    vendor: item.Vendor_Name,
                    oemMake: item.OEM_Make,
                    manufacture: item.Manufacturing_Place,
                    receiptNo: item.Reference_No || "",
                }));

                setPendingData(formattedData);

            } catch {

                const dummyData = [
                    {
                        SL_No: 1,
                        GR_No: "GR2025-001",
                        GR_Date: "2025-01-15T10:23:00.000Z",
                        BEL_Part_Number: "BEL-12345",
                        MPN: "MPN-AX45",
                        Batch_Lot_No: "BATCH-789",
                        DateCode: "2024-12",
                        Quantity: 150,
                        BEL_PO_No: "PO-56789",
                        Vendor_Name: "ABC Electronics Pvt Ltd",
                        OEM_Make: "Siemens",
                        Manufacturing_Place: "Germany",
                        Reference_No: "RCPT-001"
                    },
                    {
                        SL_No: 2,
                        GR_No: "GR2025-002",
                        GR_Date: "2025-01-20T09:10:00.000Z",
                        BEL_Part_Number: "BEL-54321",
                        MPN: "MPN-ZX90",
                        Batch_Lot_No: "BATCH-456",
                        DateCode: "2025-01",
                        Quantity: 300,
                        BEL_PO_No: "PO-99887",
                        Vendor_Name: "Global Tech Supplies",
                        OEM_Make: "Honeywell",
                        Manufacturing_Place: "USA",
                        Reference_No: "RCPT-002"
                    },
                    {
                        SL_No: 3,
                        GR_No: "GR2025-003",
                        GR_Date: "2025-01-22T14:45:00.000Z",
                        BEL_Part_Number: "BEL-67890",
                        MPN: "MPN-QT12",
                        Batch_Lot_No: "BATCH-123",
                        DateCode: "2024-10",
                        Quantity: 75,
                        BEL_PO_No: "PO-11223",
                        Vendor_Name: "Precision Components Ltd",
                        OEM_Make: "Bosch",
                        Manufacturing_Place: "India",
                        Reference_No: "RCPT-003"
                    }
                ];

                const formattedDummy = dummyData.map((item) => ({
                    slno: item.SL_No,
                    grNo: item.GR_No || "",
                    grDate: item.GR_Date ? item.GR_Date.split("T")[0] : "",
                    partNumber: item.BEL_Part_Number,
                    mpn: item.MPN,
                    batchNo: item.Batch_Lot_No,
                    dateCode: item.DateCode,
                    quantity: item.Quantity,
                    poNo: item.BEL_PO_No,
                    vendor: item.Vendor_Name,
                    oemMake: item.OEM_Make,
                    manufacture: item.Manufacturing_Place,
                    receiptNo: item.Reference_No || "",
                }));

                setPendingData(formattedDummy);
            }
        };

        fetchData();
    }, []);

    const [selectedId, setSelectedId] = useState(null);

    
    const [form, setForm] = useState({
        partNumber: "",
        mpn: "",
        batchNo: "",
        poNo: "",
        vendor: "",
        totalQty: 0,
        samplingPercent: 10,
        sampleQty: 0,
        acceptedInSample: "",
        rejectedInSample: "",
        inspectedBy: "",
        date: "",
        signature: "",
    });

    const [report, setReport] = useState({
        controlNo: "",
        remarks: "",
    });

    const [qrOpen, setQrOpen] = useState(false);
    const [qrType, setQrType] = useState(null);
    const [qrPayload, setQrPayload] = useState("");
    const [hoveredRow, setHoveredRow] = useState(null);
    const [activeCard, setActiveCard] = useState("pending");
    const [percentError, setPercentError] = useState("");
    const [indenterIntervention, setIndenterIntervention] = useState(false);
    const [processOnHold, setProcessOnHold] = useState(false);

    const cardStyle = (active, from, to) => ({
        background: active ? `linear-gradient(90deg, ${from}, ${to})` : "#f5f7fa",
        color: active ? "white" : "#222",
        cursor: "pointer",
        boxShadow: active ? "0 8px 20px rgba(16,24,40,0.12)" : "0 2px 8px rgba(16,24,40,0.06)",
        borderRadius: 1,
        transition: "all 0.18s ease",
    });

    const row = pendingData.find((r) => r.slno === selectedId);

    useEffect(() => {
        if (selectedId == null) {
            setForm((f) => ({
                ...f,
                partNumber: "",
                mpn: "",
                batchNo: "",
                poNo: "",
                vendor: "",
                totalQty: 0,
                sampleQty: 0,
                samplingPercent: 10,
                acceptedInSample: "",
                rejectedInSample: "",
            }));
            return;
        }

        const row = pendingData.find((r) => r.slno === selectedId);
        if (!row) return;

        setForm((f) => ({
            ...f,
            partNumber: row.partNumber,
            mpn: row.mpn,
            batchNo: row.batchNo,
            poNo: row.poNo,
            totalQty: row.quantity,
            vendor: row.vendor,
            samplingPercent: 10,
            sampleQty: Math.round((row.quantity * 10) / 100),
            acceptedInSample: "",
            rejectedInSample: "",
        }));
    }, [selectedId]);

    useEffect(() => {
        const p = Number(form.samplingPercent || 0);
        const total = Number(form.totalQty || 0);
        if (isNaN(p) || p < 0) return;
        const s = Math.round((total * Math.max(0, Math.min(100, p))) / 100);
        setForm((f) => ({ ...f, sampleQty: s }));
    }, [form.samplingPercent, form.totalQty]);

    useEffect(() => {
        const acc = form.acceptedInSample === "" ? null : Number(form.acceptedInSample);
        if (acc === null || isNaN(acc)) {
            setForm((f) => ({ ...f, rejectedInSample: "" }));
            return;
        }
        const rej = Number(form.sampleQty) - acc;
        setForm((f) => ({ ...f, rejectedInSample: String(rej >= 0 ? rej : 0) }));
    }, [form.acceptedInSample, form.sampleQty]);

    const handlePartNumberClick = (row) => {
        axios
            .get("http://192.168.0.149:8000/subcontractinspectiondetails", {
                params: { Ref_No: row.receiptNo }
            })
            .then((res) => {
                setHoveredRow(res.data[0]);
            })
            .catch((err) => console.error("API error:", err));
    };

    // Dummy QR handler to prevent errors
    const handleOpenQr = () => {
        console.log("QR clicked!");
    };


    function buildQrPayload(type) {
        const payload = {
            result: type === "accept" ? "ACCEPTED" : "REJECTED",
            partNumber: form.partNumber,
            mpn: form.mpn,
            batchNo: form.batchNo,
            poNo: form.poNo,
            totalQuantity: form.totalQty,
            samplingPercent: form.samplingPercent,
            sampleQty: form.sampleQty,
            acceptedInSample:
                form.acceptedInSample || (type === "accept" && form.totalQty) || 0,
            rejectedInSample:
                form.rejectedInSample || (type === "reject" && form.totalQty) || 0,
            inspectedBy: form.inspectedBy,
            date: form.date,
            signature: form.signature,
            controlNo: report.controlNo,
            vendor: report.vendor,
            remarks: report.remarks,
        };

        return Object.entries(payload)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n");
    }

    function validateBeforeQr() {
        if (!form.partNumber) return "Select a row first.";
        if (form.totalQty <= 0) return "Invalid total quantity.";
        if (!form.inspectedBy) return "Enter 'Inspected By' in the form.";
        if (!form.date) return "Enter Date.";

        const acc =
            form.acceptedInSample === "" ? null : Number(form.acceptedInSample);

        if (form.sampleQty > 0 && acc !== null) {
            if (isNaN(acc) || acc < 0 || acc > form.sampleQty) {
                return `Accepted must be between 0 and ${form.sampleQty}`;
            }
        }

        return null;
    }


    return (
        <Box sx={{ p: 1, minHeight: "100vh" }}>
            <Card sx={{ maxWidth: 3000, mx: "auto", borderRadius: 3, color: "#bf1212" }}>
                <CardContent>
                    <Typography variant="h4" align="center" sx={{ fontWeight: 800, mb: 5, fontFamily: 'Roboto' }}>
                        MATERIAL INSPECTION
                    </Typography>

                    <Tabs
                        value={tab}
                        onChange={(e, val) => setTab(val)}
                        centered
                        textColor="primary"
                        indicatorColor="primary"
                        sx={{
                            mb: 3,
                            "& .MuiTab-root": {
                                fontWeight: "bold",
                                fontSize: "1rem",
                                textTransform: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                fontFamily: 'Roboto'
                            },
                        }}
                    >
                        <Tab icon={<PendingActionsIcon />} label="Pending GR List" value="pending" />
                        <Tab
                            icon={<CheckCircleIcon color="success" />}
                            label="Accepted GR List"
                            value="accepted"
                        />
                        <Tab
                            icon={<CancelIcon color="error" />}
                            label="Rejected GR List"
                            value="rejected"
                        />
                        <Tab
                            icon={<SummarizeIcon color="primary" />}
                            label="Total"
                            value="total"
                        />
                    </Tabs>
                    <Box mt={4}>
                        {tab === "pending" && (
                            <>
                                <Grid container spacing={2}>
                                    {/* LEFT: Table */}
                                    <Grid item xs={12} md={12}>
                                        <Paper sx={{ p: 2, mb: 2 }}>
                                            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', fontFamily: 'Times New Roman', color: 'black' }}>
                                                PENDING GR LIST FOR INSPECTION
                                            </Typography>

                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        {["Sl No", "BEL Part Number", "MPN", "Batch No", "Date Code", "Quantity", "BEL PO No", "Vendor", "OEM Make", "Manufacture", "GR No", "GR Date", "Reference No"].map((h) => (
                                                            <TableCell key={h} sx={{ fontWeight: 700, color: "black", fontFamily: "Times New Roman" }}>{h}</TableCell>
                                                        ))}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {pendingData.map((row, i) => (
                                                        <TableRow
                                                            key={i}
                                                            hover
                                                            onClick={() => setSelectedId(row.slno)} // select the row
                                                            sx={{
                                                                backgroundColor: selectedId === row.slno ? "#cceaa6" : "inherit", // light green when selected
                                                                cursor: "pointer",
                                                                fontFamily: "Times New Roman"
                                                            }}
                                                        >
                                                            <TableCell>{row.slno}</TableCell>
                                                            <TableCell
                                                                style={{ color: "blue", textDecoration: "underline", cursor: "pointer" }}
                                                                onClick={() => handlePartNumberClick(row)}
                                                            >
                                                                {row.partNumber}
                                                            </TableCell>
                                                            <TableCell>{row.grNo}</TableCell>
                                                            <TableCell>{row.grDate}</TableCell>
                                                            <TableCell>{row.mpn}</TableCell>
                                                            <TableCell>{row.batchNo}</TableCell>
                                                            <TableCell>{row.dateCode}</TableCell>
                                                            <TableCell>{row.quantity}</TableCell>
                                                            <TableCell>{row.poNo}</TableCell>
                                                            <TableCell>{row.vendor}</TableCell>
                                                            <TableCell>{row.oemMake}</TableCell>
                                                            <TableCell>{row.manufacture}</TableCell>


                                                            <TableCell>{row.receiptNo}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Paper>

                                        {hoveredRow && (
                                            <SubContractForm
                                                selectedRow={hoveredRow}
                                                onClose={() => setHoveredRow(null)}   // 👈 pass the close function down
                                            />
                                        )}


                                    </Grid>

                                    {/* RIGHT: Selected item details & inspection form */}
                                    <Grid item xs={12} md={12}>
                                        <Paper sx={{ p: 2, mb: 2 }}>
                                            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: 'black', fontFamily: 'Times New Roman' }}>
                                                SELECTED ITEM IMPORTANT DETAILS
                                            </Typography>


                                            <Grid container spacing={2} sx={{ width: "100%", mx: "auto" }}>

                                                {/* FIRST ROW – PART NO | MPN | BATCH | QTY */}
                                                <Grid item xs={12} container spacing={2}>

                                                    {/* Part No */}
                                                    <Grid item xs={3}>
                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#1565c0", fontFamily: 'Times New Roman' }}>
                                                            Part No
                                                        </Typography>
                                                        <Box sx={{ mt: 0.5, px: 1, py: 0.5, bgcolor: "#e3f2fd", borderRadius: 1 }}>
                                                            <Typography sx={{ fontWeight: 700 }}>{form.partNumber || "-"}</Typography>
                                                        </Box>
                                                    </Grid>

                                                    {/* MPN */}
                                                    <Grid item xs={3}>
                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#1565c0", fontFamily: 'Times New Roman' }}>
                                                            MPN
                                                        </Typography>
                                                        <Box sx={{ mt: 0.5, px: 1, py: 0.5, bgcolor: "#e3f2fd", borderRadius: 1 }}>
                                                            <Typography sx={{ fontWeight: 700 }}>{form.mpn || "-"}</Typography>
                                                        </Box>
                                                    </Grid>

                                                    {/* Batch No */}
                                                    <Grid item xs={3}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: "#1565c0", fontFamily: 'Times New Roman' }}>
                                                            Batch No
                                                        </Typography>
                                                        <Box sx={{ mt: 0.5, px: 1, py: 0.5, bgcolor: "#e3f2fd", borderRadius: 1 }}>
                                                            <Typography sx={{ fontWeight: 700 }}>{form.batchNo || "-"}</Typography>
                                                        </Box>
                                                    </Grid>

                                                    {/* Total Qty */}
                                                    <Grid item xs={3}>
                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#2e7d32", fontFamily: 'Times New Roman' }}>
                                                            Total Qty
                                                        </Typography>
                                                        <Box sx={{ mt: 0.5, px: 1.5, py: 0.7, bgcolor: "#e8f5e9", borderRadius: 1 }}>
                                                            <Typography sx={{ fontWeight: 800, color: "green" }}>{form.totalQty}</Typography>
                                                        </Box>
                                                    </Grid>

                                                </Grid>

                                                {/* TESTING OPTIONS SECTION */}
                                                <Grid item xs={12}>
                                                    <Typography variant="h6" sx={{ mb: 1, color: 'black', fontWeight: 'bold', fontFamily: 'Times New Roman' }}>
                                                        Testing Options
                                                    </Typography>

                                                    <Stack direction="row" spacing={4} alignItems="center" sx={{ ml: "10rem" }}>
                                                        {/* Category */}
                                                        <TextField
                                                            select
                                                            label="Category"
                                                            size="small"
                                                            value={form.category || ""}
                                                            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                                            sx={{ width: 200 }}
                                                            disabled={indenterIntervention || processOnHold}
                                                        >
                                                            <MenuItem value="">Select Category</MenuItem>
                                                            <MenuItem value="Mechanical">Mechanical</MenuItem>
                                                            <MenuItem value="Electrical">Electrical</MenuItem>
                                                            <MenuItem value="Electromechanical">Electromechanical</MenuItem>
                                                        </TextField>

                                                        {/* Checkbox */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Checkbox
                                                                checked={indenterIntervention}
                                                                onChange={(e) => {
                                                                    setIndenterIntervention(e.target.checked);
                                                                    setProcessOnHold(e.target.checked);
                                                                }}
                                                            />
                                                            <Typography style={{ fontFamily: 'Times New Roman', fontSize: '10' }}>
                                                                Indenter Intervention Required
                                                            </Typography>

                                                            {processOnHold && (
                                                                <Tooltip title="Process is on hold until indenter responds">
                                                                    <PauseCircleOutlineIcon color="warning" />
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                </Grid>

                                                {/* CATEGORY FORMS */}
                                                <Grid item xs={12}>
                                                    {/* {!processOnHold && form.category && (
                                                        <Box sx={{ mt: 3 }}>
                                                            <PhysicalForm sampleCount={15} onSummaryChange={setInspectionSummary} />
                                                        </Box>
                                                    )} */}

                                                    {!processOnHold && form.category && (
                                                        <Box sx={{ mt: 3 }}>

                                                            {/* Mechanical */}
                                                            {form.category === "Mechanical" && (
                                                                <PhysicalForm sampleCount={15} onSummaryChange={setInspectionSummary} />
                                                            )}

                                                            {/* Electrical */}
                                                            {form.category === "Electrical" && (
                                                                <ElectricalForm onSummaryChange={setElectricalSummary} />
                                                            )}

                                                            {/* Electromechanical → show BOTH */}
                                                            {form.category === "Electromechanical" && (
                                                                <>
                                                                    <PhysicalForm sampleCount={15} onSummaryChange={setInspectionSummary} />
                                                                    <Box sx={{ mt: 4 }} />
                                                                    <ElectricalForm onSummaryChange={setElectricalSummary} />
                                                                </>
                                                            )}

                                                            </Box>
                                                        )}


                                                    <Divider sx={{ my: 1 }} />

                                                    {processOnHold && (
                                                        <Paper sx={{ mt: 2, p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                                                            <PauseCircleOutlineIcon color="warning" sx={{ fontSize: 40 }} />
                                                            <Box>
                                                                <Typography variant="body1">Process is on hold awaiting indenter response.</Typography>
                                                                <Typography variant="caption">Click resume to continue.</Typography>

                                                                <Box sx={{ mt: 1 }}>
                                                                    <Button
                                                                        variant="contained"
                                                                        onClick={() => {
                                                                            setProcessOnHold(false);
                                                                            setIndenterIntervention(false);
                                                                        }}
                                                                    >
                                                                        Resume Process
                                                                    </Button>
                                                                </Box>
                                                            </Box>
                                                        </Paper>
                                                    )}
                                                </Grid>

                                                {/* SUMMARY ROW */}
                                                <Grid item xs={12}>
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>

                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            <Typography>Qty Received:</Typography>
                                                            <Typography>{form.totalQty}</Typography>
                                                        </Box>

                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            <Typography>Qty Inspected:</Typography>
                                                            <TextField variant="standard" sx={{ width: 90 }} />
                                                        </Box>

                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            <Typography>Accepted:</Typography>
                                                            <TextField variant="standard" sx={{ width: 80 }} value={inspectionSummary.accepted} InputProps={{ readOnly: true }} />
                                                        </Box>

                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            <Typography>Rejected:</Typography>
                                                            <TextField variant="standard" sx={{ width: 80 }} value={inspectionSummary.rejected} InputProps={{ readOnly: true }} />
                                                        </Box>

                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            <Typography>Special Process:</Typography>
                                                            <TextField variant="standard" sx={{ width: 130 }} />
                                                        </Box>
                                                    </Box>
                                                </Grid>

                                                {/* QR BUTTONS */}
                                                <Grid item xs={12} sx={{ mt: 2 }}>
                                                    <Stack direction="row" spacing={2}>
                                                        <Button fullWidth variant="contained" color="success" onClick={() => handleOpenQr("accept")} disabled={!form.partNumber}>
                                                            <TaskAlt /><QrCode2 />
                                                        </Button>
                                                        <Button fullWidth variant="contained" color="error" onClick={() => handleOpenQr("reject")} disabled={!form.partNumber}>
                                                            <HighlightOffIcon /><QrCode2 />
                                                        </Button>
                                                    </Stack>
                                                </Grid>

                                            </Grid>

                                        </Paper>
                                    </Grid>
                                </Grid>
                                {/* QR Dialog (horizontal card) */}

                            </>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}


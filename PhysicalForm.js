
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Paper,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddBoxIcon from '@mui/icons-material/AddBox';
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SaveIcon from "@mui/icons-material/Save";
import BuildIcon from "@mui/icons-material/Build"; // Add Instrument
import AddCircleIcon from "@mui/icons-material/AddCircle";


function PhysicalForm({ sampleCount = 5, onSummaryChange }) {
  const TOLERANCE = 0.3;

  const [rows, setRows] = useState([
    {
      slno: 1,
      instrument: "",
      basicDimension: "",
      min: "",
      max: "",
      observed: Array(sampleCount).fill(""),
    },
  ]);

  const [basicDimensions, setBasicDimensions] = useState([]);
  const [inspectorSignature, setInspectorSignature] = useState(null);
  const [approverSignature, setApproverSignature] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showInstrumentTable, setShowInstrumentTable] = useState(false);
  const [showMarkingTable, setShowMarkingTable] = useState(false);

  const [instrumentRows, setInstrumentRows] = useState([
    {
      slno: 1,
      instrumentType: "",
      uniqueId: "",
      accuracy: ""
    }
  ]);

  const [form, setForm] = useState({
    partNumber: "",
    mpn: "",
    batchNo: "",
    totalQty: "",
    category: "",
  });



  useEffect(() => {
    // Dummy data for dimensions
    setBasicDimensions([
      { instrumentName: "Vernier Caliper", dimension: 50.0 },
      { instrumentName: "Scale", dimension: 75.0 },
      { instrumentName: "Tape", dimension: 25.0 },
    ]);
  }, []);

  useEffect(() => {
    if (onSummaryChange) {
      onSummaryChange(getSummary());
    }
  }, [rows]); // triggers when rows update

  // Update observed array if sampleCount changes
  useEffect(() => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        observed: Array(sampleCount)
          .fill("")
          .map((_, i) => r.observed[i] || ""),
      }))
    );
  }, [sampleCount]);

  const handleChange = (index, field, value, obsIndex = null) => {
    const regex = /^\d*\.?\d{0,2}$/;
    setRows((prev) => {
      const newRows = [...prev];
      const row = { ...newRows[index] };

      if (field === "basicDimension") {
        if (value === "" || regex.test(value)) {
          row.basicDimension = value;
          if (value) {
            const numVal = parseFloat(value);
            row.min = (numVal - TOLERANCE).toFixed(2);
            row.max = (numVal + TOLERANCE).toFixed(2);
          } else {
            row.min = "";
            row.max = "";
          }
        }
      } else if (field === "observed" && obsIndex !== null) {
        if (value === "" || regex.test(value)) {
          const updatedObserved = [...row.observed];
          updatedObserved[obsIndex] = value;
          row.observed = updatedObserved;
        }
      } else {
        if (value === "" || regex.test(value)) {
          row[field] = value;
        }
      }

      newRows[index] = row;
      return newRows;
    });
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        slno: prev.length + 1,
        instrument: "",
        basicDimension: "",
        min: "",
        max: "",
        observed: Array(sampleCount).fill(""),
      },
    ]);
  };

  const handleDeleteRow = () => {
    setRows((prev) => {
      if (prev.length === 1) return prev; // prevent deleting last row
      return prev.slice(0, -1);
    });
  };

  const handleSignatureUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "inspector") setInspectorSignature(reader.result);
        else setApproverSignature(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const response = await axios.post("/api/dimensional-inspection", { rows });
      alert("Data saved successfully!");
      console.log(response.data);
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data.");
    }
  };

  // Compute inspection results for each sample
  const getInspectionResults = () => {
    const results = [];
    rows.forEach((row) => {
      const { slno, min, max, observed } = row;
      if (!min || !max) return;
      observed.forEach((val, idx) => {
        if (val === "") return;
        const numVal = parseFloat(val);
        const status =
          numVal >= parseFloat(min) && numVal <= parseFloat(max)
            ? "Accepted"
            : "Rejected";
        results.push({
          sample: `Row ${slno} - Sample ${idx + 1}`,
          value: numVal,
          status,
        });
      });
    });
    return results;
  };

  const getSummary = () => {
    const results = getInspectionResults();
    let accepted = 0;
    let rejected = 0;
    results.forEach((r) => {
      r.status === "Accepted" ? accepted++ : rejected++;
    });
    return { accepted, rejected };
  };

  const isRejectedValue = (val, min, max) => {
    if (val === "") return false;
    const numVal = parseFloat(val);
    return numVal < parseFloat(min) || numVal > parseFloat(max);
  };

  return (
    <Grid item xs={12}>
      <Divider sx={{ my: 1 }} />
      <Box p={2} sx={{ backgroundColor: "#fff" }}>
        <Typography
          variant="h6"
          align="center"
          sx={{ fontWeight: "bold", mb: 2, textDecoration: "underline" }}
        >
          MEASURE PHYSICAL DIMENSIONS ON SAMPLE
        </Typography>



        <Typography sx={{ mt: 2, fontWeight: "bold" }}>
          General Tolerance: ± {TOLERANCE} mm
        </Typography>



        {/* Main Table with Add/Delete/View Row */}
        <TableContainer component={Paper} sx={{ border: "1px solid black", mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ border: "1px solid black", textAlign: "center", fontWeight: "bold", fontFamily: 'Times New Roman' }}>SL No</TableCell>
                <TableCell sx={{ border: "1px solid black", textAlign: "center", fontWeight: "bold", fontFamily: 'Times New Roman' }}>Basic Dimension</TableCell>
                <TableCell sx={{ border: "1px solid black", textAlign: "center", fontWeight: "bold", fontFamily: 'Times New Roman' }}>Min</TableCell>
                <TableCell sx={{ border: "1px solid black", textAlign: "center", fontWeight: "bold", fontFamily: 'Times New Roman' }}>Max</TableCell>
                {Array.from({ length: sampleCount }, (_, i) => (
                  <TableCell key={i} sx={{ border: "1px solid black", textAlign: "center", fontWeight: "bold" }}>{i + 1}</TableCell>
                ))}
                <TableCell sx={{ border: "1px solid black", textAlign: "center", fontWeight: "bold", fontFamily: 'Times New Roman' }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ border: "1px solid black", textAlign: "center", fontFamily: 'Times New Roman' }}>{i + 1}</TableCell>
                  <TableCell sx={{ border: "1px solid black", fontFamily: 'Times New Roman' }}>
                    <TextField
                      select
                      variant="standard"
                      fullWidth
                      value={row.basicDimension}
                      onChange={(e) => handleChange(i, "basicDimension", e.target.value)}
                      SelectProps={{ native: true }}
                    >
                      <option value="">Select Dimension</option>
                      {basicDimensions.map((d, idx) => (
                        <option key={idx} value={d.dimension}>{d.dimension}</option>
                      ))}
                    </TextField>
                  </TableCell>

                  <TableCell sx={{ border: "1px solid black", textAlign: "center", fontFamily: 'Times New Roman' }}>{row.min}</TableCell>
                  <TableCell sx={{ border: "1px solid black", textAlign: "center", fontFamily: 'Times New Roman' }}>{row.max}</TableCell>

                  {row.observed.map((val, j) => (
                    <TableCell
                      key={j}
                      sx={{
                        border: "1px solid black",
                        backgroundColor: isRejectedValue(val, row.min, row.max) ? "#ffcccc" : "#ffffff",
                      }}
                    >
                      <TextField
                        variant="standard"
                        fullWidth
                        value={val}
                        onChange={(e) => handleChange(i, "observed", e.target.value, j)}
                      />
                    </TableCell>
                  ))}

                  {/* Actions for Add/Delete Row */}
                  <TableCell sx={{ border: "1px solid black", textAlign: "center", fontFamily: 'Times New Roman' }}>
                    <AddCircleIcon
                      sx={{ color: "green", cursor: "pointer", fontSize: 30 }}
                      onClick={() => {
                        const updated = [...rows];
                        updated.splice(i + 1, 0, {
                          slno: i + 2,
                          instrument: "",
                          basicDimension: "",
                          min: "",
                          max: "",
                          observed: Array(sampleCount).fill(""),
                        });
                        const normalized = updated.map((r, idx) => ({ ...r, slno: idx + 1 }));
                        setRows(normalized);
                      }}
                    />
                    <DeleteIcon
                      sx={{
                        color: "red",
                        cursor: rows.length > 1 ? "pointer" : "not-allowed",
                        opacity: rows.length > 1 ? 1 : 0.4,
                        fontSize: 30
                      }}
                      onClick={() => {
                        if (rows.length === 1) return;
                        const updated = rows.filter((_, idx) => idx !== i);
                        const normalized = updated.map((r, idx) => ({ ...r, slno: idx + 1 }));
                        setRows(normalized);
                      }}
                    />
                    <VisibilityIcon
                      sx={{ color: "blue", cursor: "pointer", fontSize: 30, ml: 1 }}
                      onClick={() => setShowResults(prev => !prev)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>




        <Box mb={2} display="flex" justifyContent="flex-end" gap={3} sx={{ mt: 2 }}>



          <Button variant="contained" style={{ width: "10rem", backgroundColor: 'aliceblue', color: 'black' }}
            startIcon={<SaveIcon />} onClick={handleSave}>
            Save
          </Button>

          <Button variant="contained" style={{ width: "12rem", backgroundColor: 'aliceblue', color: 'black' }}
            startIcon={<BuildIcon />} onClick={() => setShowInstrumentTable(prev => !prev)}>
            Instrument
          </Button>

          <Button
            variant="contained"
            style={{ width: "14rem", backgroundColor: 'aliceblue', color: 'black' }}
            startIcon={<BuildIcon />}
            onClick={() => setShowMarkingTable(prev => !prev)}
          >
            Additional Details
          </Button>


        </Box>

        {showInstrumentTable && (
          <Box mt={4}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                mb: 2,
                fontFamily: "Times New Roman",
                color: "#0d47a1",
                textDecoration: "underline",
              }}
            >
              Instrument Registration
            </Typography>

            <TableContainer
              component={Paper}
              elevation={4}
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid #d0d0d0",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
                    <TableCell
                      sx={{ borderRight: "1px solid #bdbdbd", textAlign: "center", fontWeight: "bold" }}
                    >
                      SL No
                    </TableCell>
                    <TableCell sx={{ borderRight: "1px solid #bdbdbd", textAlign: "center", fontWeight: "bold" }}>
                      Instrument Type
                    </TableCell>
                    <TableCell sx={{ borderRight: "1px solid #bdbdbd", textAlign: "center", fontWeight: "bold" }}>
                      Unique ID
                    </TableCell>
                    <TableCell sx={{ borderRight: "1px solid #bdbdbd", textAlign: "center", fontWeight: "bold" }}>
                      Measurement Accuracy
                    </TableCell>
                    <TableCell sx={{ textAlign: "center", fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {instrumentRows.map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        "&:hover": { backgroundColor: "#f5faff" },
                        transition: "0.2s",
                      }}
                    >
                      {/* SL No */}
                      <TableCell sx={{ textAlign: "center", fontSize: "0.9rem" }}>
                        {index + 1}
                      </TableCell>

                      {/* Instrument Type */}
                      <TableCell>
                        <TextField
                          select
                          variant="outlined"
                          size="small"
                          fullWidth
                          value={row.instrumentType}
                          onChange={(e) => {
                            const updated = [...instrumentRows];
                            updated[index].instrumentType = e.target.value;
                            setInstrumentRows(updated);
                          }}
                        >
                          <MenuItem value="">Select</MenuItem>
                          <MenuItem value="Vernier Caliper">Vernier Caliper</MenuItem>
                          <MenuItem value="Scale">Scale</MenuItem>
                          <MenuItem value="Tape">Tape</MenuItem>
                        </TextField>
                      </TableCell>

                      {/* Unique ID */}
                      <TableCell>
                        <TextField
                          variant="outlined"
                          size="small"
                          fullWidth
                          placeholder="Enter ID"
                          value={row.uniqueId}
                          onChange={(e) => {
                            const updated = [...instrumentRows];
                            updated[index].uniqueId = e.target.value;
                            setInstrumentRows(updated);
                          }}
                        />
                      </TableCell>

                      {/* Accuracy */}
                      <TableCell>
                        <TextField
                          variant="outlined"
                          size="small"
                          fullWidth
                          placeholder="Enter Accuracy"
                          value={row.accuracy}
                          onChange={(e) => {
                            const updated = [...instrumentRows];
                            updated[index].accuracy = e.target.value;
                            setInstrumentRows(updated);
                          }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ textAlign: "center" }}>
                        <AddCircleIcon
                          sx={{
                            color: "green",
                            cursor: "pointer",
                            fontSize: 28,
                            mx: 1,
                            "&:hover": { transform: "scale(1.1)" },
                            transition: "0.2s",
                          }}
                          onClick={() => {
                            const updated = [...instrumentRows];
                            updated.splice(index + 1, 0, {
                              slno: index + 2,
                              instrumentType: "",
                              uniqueId: "",
                              accuracy: "",
                            });

                            const normalized = updated.map((r, i) => ({
                              ...r,
                              slno: i + 1,
                            }));

                            setInstrumentRows(normalized);
                          }}
                        />

                        <DeleteIcon
                          sx={{
                            color: "red",
                            cursor: instrumentRows.length > 1 ? "pointer" : "not-allowed",
                            opacity: instrumentRows.length > 1 ? 1 : 0.4,
                            fontSize: 26,
                            "&:hover": {
                              transform: instrumentRows.length > 1 ? "scale(1.1)" : "none",
                            },
                            transition: "0.2s",
                          }}
                          onClick={() => {
                            if (instrumentRows.length === 1) return;

                            const updated = instrumentRows.filter((_, i) => i !== index);

                            const normalized = updated.map((r, i) => ({
                              ...r,
                              slno: i + 1,
                            }));

                            setInstrumentRows(normalized);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}


        {showMarkingTable && (
          <Card
            sx={{
              p: 4,
              mt: 4,
              width: "100%",
              border: "1px solid #cfcfcf",
              boxShadow: "0px 3px 10px rgba(0,0,0,0.1)",
              borderRadius: "12px",
              background: "linear-gradient(to bottom, #fafafa, #ffffff)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                mb: 3,
                textDecoration: "underline",
                fontFamily: "Times New Roman",
                color: "#0d47a1",
              }}
            >
              Marking & Remarks2
            </Typography>

            {/* FULL WIDTH WRAPPER */}
            <Box sx={{ width: "100%" }}>

              {/* MARKING ON PACKAGE – FULL WIDTH TABLE */}
              <TableContainer
                component={Paper}
                elevation={3}
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid #bfbfbf",
                }}
              >
                <Table size="small" sx={{ width: "100%" }}>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          width: "25%",
                          fontFamily: "Times New Roman",
                          backgroundColor: "#e3f2fd",
                          borderRight: "1px solid #bdbdbd",
                          fontSize: "0.95rem",
                        }}
                      >
                        Marking on Package
                      </TableCell>

                      <TableCell sx={{ fontFamily: "Times New Roman", fontSize: "0.9rem" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <Typography>Vendor : {form.vendor || ""}</Typography>
                          <Typography>Part No : {form.partNumber || ""}</Typography>
                          <Typography>PO No : {form.poNo || ""}</Typography>
                          <Typography>MPN : {form.mpn || ""}</Typography>
                          <Typography>Manufacture : {form.manufacture || ""}</Typography>
                          <Typography>Date/Lot/Batch No : {form.batchNo || ""}</Typography>
                          <Typography>Qty : {form.totalQty || ""}</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* REMARK SECTION */}
              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: "#f7f9fc",
                  border: "1px solid #e0e0e0",
                }}
              >

                {/* Marking on Material */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "Times New Roman",
                      color: "#1a237e",
                    }}
                  >
                    Marking on Material :
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                    sx={{ mt: 1 }}
                    placeholder="Enter marking on material"
                  />
                </Box>

                {/* Dimensional Remark */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "Times New Roman",
                      color: "#1a237e",
                    }}
                  >
                    Dimensional Remark :
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                    sx={{ mt: 1 }}
                    placeholder="NIL if empty"
                  />
                </Box>

                {/* Visual Inspection Remark */}
                <Box>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "Times New Roman",
                      color: "#1a237e",
                    }}
                  >
                    Visual Inspection Remark :
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                    sx={{ mt: 1 }}
                    placeholder="NIL if empty"
                  />
                </Box>

              </Box>
            </Box>
          </Card>
        )}








        {/* Results Table */}
        {showResults && (
          <Box mt={4}>
            <Typography variant="h6" sx={{ fontWeight: "bold", textDecoration: "underline", mb: 1 }}>
              Inspection Results
            </Typography>
            <TableContainer component={Paper} sx={{ border: "1px solid black" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ border: "1px solid black", textAlign: "center", fontWeight: "bold" }}>Sample</TableCell>
                    <TableCell sx={{ border: "1px solid black", textAlign: "center", fontWeight: "bold" }}>Observed Value</TableCell>
                    <TableCell sx={{ border: "1px solid black", textAlign: "center", fontWeight: "bold" }}>Result</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getInspectionResults().map((res, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ border: "1px solid black", textAlign: "center" }}>{res.sample}</TableCell>
                      <TableCell sx={{ border: "1px solid black", textAlign: "center" }}>{res.value}</TableCell>
                      <TableCell
                        sx={{
                          border: "1px solid black",
                          textAlign: "center",
                          color: res.status === "Rejected" ? "red" : "green",
                          fontWeight: "bold",
                        }}
                      >
                        {res.status}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Summary row */}
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      sx={{ border: "1px solid black", textAlign: "center", fontWeight: "bold", backgroundColor: "#f0f0f0" }}
                    >
                      Total Accepted: {getSummary().accepted} | Total Rejected: {getSummary().rejected}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    </Grid>
  );
}

export default PhysicalForm;


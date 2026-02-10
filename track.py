def format_step_data(step_obj) -> StepDetail:
    """
    Helper to convert a ProcessFlowMaster SQLAlchemy object 
    into a Pydantic schema (StepDetail).
    """
    if not step_obj:
        return None
        
    operators = [
        OperatorInfo(
            operator_staff_no=op.operator_staff_no,
            operator_name=op.operator_name,
            operator_MRL=op.operator_MRL
        ) for op in step_obj.qualified_operators
    ]
    
    return StepDetail(
        step_id=step_obj.flow_step_id,
        step_order=step_obj.step_order,
        step_name=step_obj.step_name,
        qualified_operators=operators
    )


#######################################################################################

@app.get("/pcb-process-tracking", response_model=List[PCBProcessStatus])
def get_pcb_process_tracking(db: Session = Depends(get_db)):
    """
    Retrieves all assigned PCBs with their current, previous (3), and next (3) process steps
    and the operators qualified to perform them.
    """
    
    # 1. Fetch Process Master Data (Cached lookup)
    # We fetch all steps and operators once to avoid N+1 queries inside the loop.
    all_steps = (
        db.query(ProcessFlowMaster)
        .options(joinedload(ProcessFlowMaster.qualified_operators))
        .order_by(ProcessFlowMaster.step_order)
        .all()
    )
    
    # Create a lookup dictionary to find a step's index in the sorted list by its ID
    # key: flow_step_id, value: index in the all_steps list
    step_index_map = {step.flow_step_id: i for i, step in enumerate(all_steps)}

    # 2. Fetch Assignments joined with PCB Data
    # We need PcbData for the 'serialNo' and Assignment for 'current_step_id'
    results = (
        db.query(PCBAssignment, PcbData)
        .join(PcbData, PCBAssignment.assigned_pcb_id == PcbData.PCBserialNoPartNumber)
        .all()
    )

    response_data = []

    for assignment, pcb in results:
        current_step_id = assignment.current_step_id
        
        # Initialize default values
        current_step_obj = None
        current_step_idx = -1
        
        # Find where the current step sits in the master flow
        if current_step_id in step_index_map:
            current_step_idx = step_index_map[current_step_id]
            current_step_obj = all_steps[current_step_idx]

        # --- Logic for Previous / Next Windows ---
        prev_steps_data = []
        next_steps_data = []

        if current_step_idx != -1:
            # Get Previous 3 (slicing handles bounds automatically)
            # If index is 5, we want indices 2, 3, 4. 
            start_prev = max(0, current_step_idx - 3)
            prev_steps_objs = all_steps[start_prev:current_step_idx]
            prev_steps_data = [format_step_data(s) for s in prev_steps_objs]

            # Get Next 3
            # If index is 5, we want indices 6, 7, 8
            next_steps_objs = all_steps[current_step_idx + 1 : current_step_idx + 4]
            next_steps_data = [format_step_data(s) for s in next_steps_objs]

        # --- Build Response Object ---
        pcb_entry = PCBProcessStatus(
            assigned_pcb_id=assignment.assigned_pcb_id,
            serial_no=pcb.serialNo,
            current_step_id=current_step_id,
            current_step_order=current_step_obj.step_order if current_step_obj else None,
            current_step_name=current_step_obj.step_name if current_step_obj else "Unknown/Not Started",
            current_step_operators=[
                OperatorInfo(
                    operator_staff_no=op.operator_staff_no,
                    operator_name=op.operator_name,
                    operator_MRL=op.operator_MRL
                ) for op in current_step_obj.qualified_operators
            ] if current_step_obj else [],
            previous_steps=prev_steps_data,
            next_steps=next_steps_data
        )
        
        response_data.append(pcb_entry)

    return response_data

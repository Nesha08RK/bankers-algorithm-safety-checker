let resourceCount = 3; // Default value
let processCount = 5; // Fixed number of processes
let defaultValues = {
    available: [10, 5, 7],
    allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2]
    ],
    maximum: [
        [0, 1, 0],
        [2, 2, 3],
        [5, 2, 2],
        [2, 3, 2],
        [0, 2, 2]
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('resourceCount').addEventListener('input', () => {
        const count = parseInt(document.getElementById('resourceCount').value);
        if (count >= 2 && count <= 10) {
            resourceCount = count;
        }
    });
});

function generateInterface() {
    const count = parseInt(document.getElementById('resourceCount').value);
    if (count < 2 || count > 10 || isNaN(count)) {
        alert('Please enter a valid number of resources (2-10).');
        return;
    }
    resourceCount = count;

    // Show hidden sections
    document.getElementById('resources').style.display = 'block';
    document.getElementById('processes').style.display = 'block';

    // Generate Available Resources inputs
    const resourceInputs = document.getElementById('resource-inputs');
    resourceInputs.innerHTML = '';
    for (let i = 0; i < resourceCount; i++) {
        const div = document.createElement('div');
        div.innerHTML = `
            <label for="resource${i}">Resource R${i}:</label>
            <input type="number" id="resource${i}" min="0" value="${defaultValues.available[i] || 0}" required>
        `;
        resourceInputs.appendChild(div);
    }

    // Generate Process Table
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');
    tableHead.innerHTML = `
        <tr>
            <th>Process</th>
            <th>Allocation</th>
            <th>Maximum</th>
            <th>Need</th>
        </tr>
    `;
    tableBody.innerHTML = '';

    for (let i = 0; i < processCount; i++) {
        let allocationInputs = '';
        let maxInputs = '';
        let needSpans = '';
        for (let j = 0; j < resourceCount; j++) {
            allocationInputs += `<input type="number" id="p${i}r${j}-allocated" min="0" value="${defaultValues.allocation[i][j] || 0}" required>`;
            maxInputs += `<input type="number" id="p${i}r${j}-max" min="0" value="${defaultValues.maximum[i][j] || 0}" required>`;
            needSpans += `<span id="p${i}r${j}-need">0</span>`;
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>P${i}</td>
            <td>${allocationInputs}</td>
            <td>${maxInputs}</td>
            <td>${needSpans}</td>
        `;
        tableBody.appendChild(row);
    }

    // Add event listeners for real-time updates
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.removeEventListener('input', calculateNeedMatrix); // Prevent duplicate listeners
        input.addEventListener('input', calculateNeedMatrix);
    });

    calculateNeedMatrix();
}

function calculateNeedMatrix() {
    for (let i = 0; i < processCount; i++) {
        for (let j = 0; j < resourceCount; j++) {
            const allocated = parseInt(document.getElementById(`p${i}r${j}-allocated`).value) || 0;
            const max = parseInt(document.getElementById(`p${i}r${j}-max`).value) || 0;
            const need = max - allocated;
            const needElement = document.getElementById(`p${i}r${j}-need`);
            if (needElement) {
                needElement.textContent = need >= 0 ? need : 'Invalid';
            }
        }
    }
}

function validateInputs() {
    const inputs = document.querySelectorAll('input[type="number"]');
    for (let input of inputs) {
        if (input.value === '' || parseInt(input.value) < 0) {
            alert('Please enter valid non-negative numbers for all inputs.');
            return false;
        }
    }
    for (let i = 0; i < processCount; i++) {
        for (let j = 0; j < resourceCount; j++) {
            const allocated = parseInt(document.getElementById(`p${i}r${j}-allocated`).value) || 0;
            const max = parseInt(document.getElementById(`p${i}r${j}-max`).value) || 0;
            if (allocated > max) {
                alert(`Invalid input: Allocation exceeds Maximum for P${i} Resource R${j}.`);
                return false;
            }
        }
    }
    return true;
}

function checkSafety() {
    if (!validateInputs()) return;

    calculateNeedMatrix();

    const available = Array(resourceCount).fill(0);
    for (let i = 0; i < resourceCount; i++) {
        available[i] = parseInt(document.getElementById(`resource${i}`).value);
    }

    const allocated = [];
    const max = [];
    const need = [];

    for (let i = 0; i < processCount; i++) {
        allocated.push(Array(resourceCount).fill(0));
        max.push(Array(resourceCount).fill(0));
        need.push(Array(resourceCount).fill(0));
        for (let j = 0; j < resourceCount; j++) {
            allocated[i][j] = parseInt(document.getElementById(`p${i}r${j}-allocated`).value);
            max[i][j] = parseInt(document.getElementById(`p${i}r${j}-max`).value);
            need[i][j] = max[i][j] - allocated[i][j];
        }
    }

    let work = [...available];
    let finish = Array(processCount).fill(false);
    let safeSequence = [];
    let steps = [];

    // Add initial state to steps
    steps.push({
        step: 0,
        description: `Initial State: Work = (${work.map((v, i) => `R${i}: ${v}`).join(', ')}), Safe Sequence = []`
    });

    // Find a safe sequence
    let stepCount = 1;
    while (safeSequence.length < processCount) {
        let found = false;
        for (let i = 0; i < processCount; i++) {
            if (!finish[i]) {
                let canAllocate = true;
                for (let j = 0; j < resourceCount; j++) {
                    if (need[i][j] > work[j]) {
                        canAllocate = false;
                        break;
                    }
                }
                if (canAllocate) {
                    steps.push({
                        step: stepCount,
                        description: `Allocate P${i}: Need (${need[i].map((v, j) => `R${j}: ${v}`).join(', ')}) ≤ Work (${work.map((v, j) => `R${j}: ${v}`).join(', ')})`
                    });
                    for (let j = 0; j < resourceCount; j++) {
                        work[j] += allocated[i][j];
                    }
                    finish[i] = true;
                    safeSequence.push(`P${i}`);
                    steps.push({
                        step: stepCount,
                        description: `P${i} completes, releases Allocation (${allocated[i].map((v, j) => `R${j}: ${v}`).join(', ')}). New Work = (${work.map((v, j) => `R${j}: ${v}`).join(', ')}), Safe Sequence = [${safeSequence.join(', ')}]`
                    });
                    found = true;
                    stepCount++;
                    break;
                }
            }
        }
        if (!found) {
            steps.push({
                step: stepCount,
                description: `No process can be allocated. Work = (${work.map((v, j) => `R${j}: ${v}`).join(', ')})`
            });
            displayResult(false, [], steps);
            return;
        }
    }

    displayResult(true, safeSequence, steps);
}

function displayResult(isSafe, sequence = [], steps = []) {
    const output = document.getElementById("output");
    output.className = 'output ' + (isSafe ? 'safe' : 'unsafe');
    output.innerHTML = isSafe
        ? `<strong>Safe Sequence:</strong> ${sequence.join(" → ")}`
        : `<strong>Unsafe Sequence:</strong> The system is in an unsafe state.`;

    const stepsContent = document.getElementById("steps-content");
    stepsContent.innerHTML = steps.map(step => `
        <div class="step">
            <strong>Step ${step.step}:</strong> ${step.description}
        </div>
    `).join('');
}

function resetForm() {
    document.getElementById('resourceCount').value = '3';
    resourceCount = 3;
    document.getElementById('resources').style.display = 'none';
    document.getElementById('processes').style.display = 'none';
    document.getElementById('output').innerHTML = '';
    document.getElementById('output').className = 'output';
    document.getElementById('steps-content').innerHTML = '';
}
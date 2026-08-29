<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>GIA Project Proposal</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #111; }
        h1 { text-align: center; font-size: 15px; margin-bottom: 18px; }
        .header-block p { margin: 2px 0; }
        .label-col { font-weight: bold; width: 160px; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 14px; }
        td, th { border: 1px solid #333; padding: 5px 7px; vertical-align: top; }
        .section-title { font-weight: bold; font-size: 12px; margin-top: 18px; margin-bottom: 4px; }
        .checkbox { display: inline-block; width: 10px; height: 10px; border: 1px solid #333; margin-right: 4px; text-align: center; font-size: 9px; }
        .footer { margin-top: 24px; font-size: 9px; color: #555; text-align: center; }
    </style>
</head>
<body>
    <h1>GRANTS-IN-AID (GIA) PROJECT PROPOSAL</h1>

    <div class="header-block">
        <p><span class="label-col">PROJECT TITLE:</span> {{ $data['projectTitle'] ?? '' }}</p>
        <p><span class="label-col">PROPONENT:</span> {{ $data['organizationName'] ?? '' }}, {{ $data['officeAddress'] ?? '' }}</p>
    </div>

    <p><strong>OBJECTIVES:</strong></p>
    <p><strong>General Objective</strong><br>{{ $data['generalObjective'] ?? '' }}</p>
    <p><strong>Specific Objectives</strong><br>{{ $data['specificObjectives'] ?? '' }}</p>

    <p><strong>PROJECT BACKGROUND:</strong></p>

    <div class="section-title">A. Proponent Profile</div>
    <table>
        <tr><td class="label-col">Organization Name</td><td>{{ $data['organizationName'] ?? '' }}</td></tr>
        <tr><td class="label-col">Office Address</td><td>{{ $data['officeAddress'] ?? '' }}</td></tr>
        <tr><td class="label-col">Project Leader</td><td>{{ $data['projectLeader'] ?? '' }}</td></tr>
        <tr><td class="label-col">Position</td><td>{{ $data['position'] ?? '' }}</td></tr>
        <tr><td class="label-col">Contact No.</td><td>{{ $data['contactNumber'] ?? '' }}</td></tr>
        <tr><td class="label-col">E-mail Address</td><td>{{ $data['emailAddress'] ?? '' }}</td></tr>
        <tr>
            <td class="label-col">Proponent Category</td>
            <td>
                @php $category = $data['proponentCategory'] ?? ''; @endphp
                @foreach (['Private Sector', 'Higher Education Institution', 'Barangay LGU'] as $option)
                    <span class="checkbox">{{ $category === $option ? 'X' : '' }}</span> {{ $option }}&nbsp;&nbsp;
                @endforeach
            </td>
        </tr>
    </table>

    <div class="section-title">B. Project Classification</div>
    <table>
        <tr><td class="label-col">Project Category</td><td>{{ $data['projectCategory'] ?? '' }}</td></tr>
        <tr><td class="label-col">Project Type</td><td>{{ $data['projectType'] ?? '' }}</td></tr>
    </table>

    <div class="section-title">C. Project Summary and Rationale</div>
    <table>
        <tr><td class="label-col">Project Summary</td><td>{{ $data['projectSummary'] ?? '' }}</td></tr>
        <tr><td class="label-col">Project Rationale</td><td>{{ $data['projectRationale'] ?? '' }}</td></tr>
    </table>

    <div class="section-title">D. Implementation and Results</div>
    <table>
        <tr><td class="label-col">Site of Implementation</td><td>{{ $data['siteOfImplementation'] ?? '' }}</td></tr>
        <tr><td class="label-col">Target Beneficiaries</td><td>{{ $data['targetBeneficiaries'] ?? '' }}</td></tr>
        <tr><td class="label-col">Implementation Approach</td><td>{{ $data['methodology'] ?? '' }}</td></tr>
        <tr><td class="label-col">Expected Outputs</td><td>{{ $data['expectedOutputs'] ?? '' }}</td></tr>
        <tr><td class="label-col">Sustainability Plan</td><td>{{ $data['sustainabilityPlan'] ?? '' }}</td></tr>
    </table>

    <div class="footer">
        GIA Guidelines Annex A-1: GIA Form 001 &ndash; Grants-in-Aid Project Proposal Format
    </div>
</body>
</html>

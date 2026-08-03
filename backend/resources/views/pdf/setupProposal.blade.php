<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SETUP Project Proposal</title>
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
    <h1>PROJECT PROPOSAL</h1>

    <div class="header-block">
        <p><span class="label-col">PROJECT TITLE:</span> {{ $data['projectTitle'] ?? '' }}</p>
        <p><span class="label-col">PROPONENT:</span> {{ $data['businessName'] ?? '' }}, {{ $data['businessAddress'] ?? '' }}</p>
    </div>

    <p><strong>OBJECTIVES:</strong></p>
    <p><strong>General Objectives</strong><br>{{ $data['generalObjective'] ?? '' }}</p>
    <p><strong>Specific Objectives</strong><br>{{ $data['specificObjectives'] ?? '' }}</p>

    <p><strong>PROJECT BACKGROUND:</strong></p>

    <div class="section-title">A. Company Profile</div>
    <table>
        <tr><td class="label-col">Name of Firm</td><td>{{ $data['businessName'] ?? '' }}</td></tr>
        <tr><td class="label-col">Address</td><td>{{ $data['businessAddress'] ?? '' }}</td></tr>
        <tr><td class="label-col">Contact Person</td><td>{{ $data['contactPerson'] ?? '' }}</td></tr>
        <tr><td class="label-col">Contact No.</td><td>{{ $data['contactNumber'] ?? '' }}</td></tr>
        <tr><td class="label-col">E-mail Address</td><td>{{ $data['emailAddress'] ?? '' }}</td></tr>
        <tr><td class="label-col">Year Established</td><td>{{ $data['yearEstablished'] ?? '' }}</td></tr>
        <tr>
            <td class="label-col">Type of Organization</td>
            <td>
                @php $orgType = $data['organizationType'] ?? ''; @endphp
                @foreach (['Sole Proprietorship', 'Partnership', 'Cooperative', 'Corporation'] as $option)
                    <span class="checkbox">{{ $orgType === $option ? 'X' : '' }}</span> {{ $option }}&nbsp;&nbsp;
                @endforeach
            </td>
        </tr>
        <tr>
            <td class="label-col">Business Size</td>
            <td>
                @php $size = $data['businessSize'] ?? ''; @endphp
                @foreach (['Micro', 'Small', 'Medium'] as $option)
                    <span class="checkbox">{{ $size === $option ? 'X' : '' }}</span> {{ $option }}&nbsp;&nbsp;
                @endforeach
            </td>
        </tr>
        <tr><td class="label-col">Number of Employees</td><td>{{ $data['numberOfEmployees'] ?? '' }}</td></tr>
        <tr><td class="label-col">Business Activity/ies</td><td>{{ $data['businessIndustry'] ?? '' }}</td></tr>
        <tr><td class="label-col">Products / Services</td><td>{{ $data['productsServices'] ?? '' }}</td></tr>
        <tr><td class="label-col">Brief Enterprise Background</td><td>{{ $data['enterpriseBackground'] ?? '' }}</td></tr>
    </table>
    <div class="footer">
        SETUP Guidelines (Revision 3.0) Annex A-1: SETUP Form 001 &ndash; SETUP Project Proposal Format
    </div>
</body>
</html>

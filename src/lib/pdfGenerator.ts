import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MeetingRecord, Member } from '../types';

interface GenerateMeetingPDFOptions {
  date: string;
  records: MeetingRecord[];
  totals: {
    loan: number;
    interest: number;
    saving: number;
    total: number;
  };
  gatName?: string;
  regNo?: string;
}

interface GenerateMembersPDFOptions {
  members: Member[];
  gatName?: string;
}

/**
 * Returns clean html2canvas config that strips Tailwind v4 stylesheets containing oklch colors
 * from the cloned iframe, avoiding "unsupported color function oklch" errors.
 */
const getHtml2CanvasConfig = () => ({
  scale: 2,
  useCORS: true,
  logging: false,
  backgroundColor: '#ffffff',
  windowWidth: 800,
  onclone: (clonedDoc: Document) => {
    // Remove all style & link tags from the cloned document to eliminate Tailwind v4 oklch rules
    const stylesAndLinks = clonedDoc.querySelectorAll('style, link');
    stylesAndLinks.forEach((el) => el.remove());

    // Inject clean, self-contained CSS for the PDF template
    const cleanStyle = clonedDoc.createElement('style');
    cleanStyle.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&display=swap');
      
      * {
        box-sizing: border-box;
        font-family: 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        background-color: #ffffff !important;
        color: #1c1917 !important;
      }
    `;
    clonedDoc.head.appendChild(cleanStyle);

    // Make the cloned PDF container visible at (0,0) in the cloned iframe
    const clonedContainer = clonedDoc.querySelector('[data-pdf-container="true"]') as HTMLElement;
    if (clonedContainer) {
      clonedContainer.style.position = 'relative';
      clonedContainer.style.left = '0';
      clonedContainer.style.top = '0';
      clonedContainer.style.margin = '0';
    }
  }
});

/**
 * Creates a hidden HTML element styled professionally for Marathi PDF generation,
 * captures it with html2canvas and converts it to a clean jsPDF document.
 */
export async function generateMeetingPDF({
  date,
  records,
  totals,
  gatName = 'तुळजाभवानी महिला बचत गट',
  regNo = 'MH/BG/2024/786'
}: GenerateMeetingPDFOptions): Promise<void> {
  const formattedDate = new Date(date).toLocaleDateString('mr-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const presentCount = records.filter(r => r.present !== false).length;
  const totalCount = records.length;

  // Create temporary offscreen element
  const container = document.createElement('div');
  container.setAttribute('data-pdf-container', 'true');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = "'Noto Sans Devanagari', sans-serif";
  container.style.color = '#1c1917';
  container.style.padding = '0';
  container.style.boxSizing = 'border-box';

  container.innerHTML = `
    <div style="padding: 32px; background-color: #ffffff;">
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px; border-radius: 16px; color: #ffffff; text-align: center; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
          <div style="width: 44px; height: 44px; background-color: #ffffff; color: #047857; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 900;">
            तु
          </div>
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${gatName}</h1>
        </div>
        <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #ecfdf5; letter-spacing: 0.5px;">नोंदणीकृत महिला स्वयंसहाय्यता बचत गट | नोंदणी क्र. ${regNo}</p>
        <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 4px 16px; border-radius: 9999px; font-size: 13px; font-weight: 800; border: 1px solid rgba(255,255,255,0.3);">
          मासिक सभा नोंदणी व हिशोब अहवाल - ${formattedDate}
        </div>
      </div>

      <!-- Quick Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px 14px; border-radius: 12px; text-align: center;">
          <div style="font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; margin-bottom: 2px;">उपस्थिती</div>
          <div style="font-size: 18px; font-weight: 900; color: #065f46;">${presentCount} / ${totalCount} सदस्य</div>
        </div>
        <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 12px 14px; border-radius: 12px; text-align: center;">
          <div style="font-size: 11px; font-weight: 800; color: #c2410c; text-transform: uppercase; margin-bottom: 2px;">एकूण कर्ज भरणा</div>
          <div style="font-size: 18px; font-weight: 900; color: #9a3412;">₹${totals.loan.toLocaleString('mr-IN')}</div>
        </div>
        <div style="background-color: #eff6ff; border: 1px solid #dbeafe; padding: 12px 14px; border-radius: 12px; text-align: center;">
          <div style="font-size: 11px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; margin-bottom: 2px;">एकूण जमा व्याज</div>
          <div style="font-size: 18px; font-weight: 900; color: #1e40af;">₹${totals.interest.toLocaleString('mr-IN')}</div>
        </div>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 14px; border-radius: 12px; text-align: center;">
          <div style="font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase; margin-bottom: 2px;">मासिक बचत जमा</div>
          <div style="font-size: 18px; font-weight: 900; color: #166534;">₹${totals.saving.toLocaleString('mr-IN')}</div>
        </div>
      </div>

      <!-- Register Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px;">
        <thead>
          <tr style="background-color: #047857; color: #ffffff;">
            <th style="padding: 10px; border: 1px solid #047857; text-align: center; width: 40px; font-weight: 800;">अ.क्र.</th>
            <th style="padding: 10px; border: 1px solid #047857; text-align: left; font-weight: 800;">सदस्याचे पूर्ण नाव</th>
            <th style="padding: 10px; border: 1px solid #047857; text-align: center; width: 90px; font-weight: 800;">उपस्थिती</th>
            <th style="padding: 10px; border: 1px solid #047857; text-align: right; width: 90px; font-weight: 800;">कर्ज (₹)</th>
            <th style="padding: 10px; border: 1px solid #047857; text-align: right; width: 85px; font-weight: 800;">व्याज (₹)</th>
            <th style="padding: 10px; border: 1px solid #047857; text-align: right; width: 85px; font-weight: 800;">बचत (₹)</th>
            <th style="padding: 10px; border: 1px solid #047857; text-align: right; width: 100px; font-weight: 800;">एकूण (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${records.map((r, i) => {
            const isEven = i % 2 === 0;
            const bg = isEven ? '#ffffff' : '#f8fafc';
            const isPresent = r.present !== false;
            return `
              <tr style="background-color: ${bg};">
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${i + 1}</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 800; color: #1e293b;">${r.memberName}</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">
                  <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; ${
                    isPresent
                      ? 'background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;'
                      : 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;'
                  }">
                    ${isPresent ? 'उपस्थित' : 'अनुपस्थित'}
                  </span>
                </td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #ea580c;">₹${(r.loan || 0).toLocaleString('mr-IN')}</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #2563eb;">₹${(r.interest || 0).toLocaleString('mr-IN')}</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #059669;">₹${(r.saving || 0).toLocaleString('mr-IN')}</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 900; color: #0f172a; background-color: rgba(241, 245, 249, 0.5);">₹${(r.total || 0).toLocaleString('mr-IN')}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #1e293b; color: #ffffff; font-weight: 900; font-size: 13px;">
            <td colSpan="3" style="padding: 12px; border: 1px solid #1e293b; text-align: right;">एकूण जमा (Grand Total):</td>
            <td style="padding: 12px; border: 1px solid #1e293b; text-align: right; color: #ffedd5;">₹${totals.loan.toLocaleString('mr-IN')}</td>
            <td style="padding: 12px; border: 1px solid #1e293b; text-align: right; color: #dbeafe;">₹${totals.interest.toLocaleString('mr-IN')}</td>
            <td style="padding: 12px; border: 1px solid #1e293b; text-align: right; color: #a7f3d0;">₹${totals.saving.toLocaleString('mr-IN')}</td>
            <td style="padding: 12px; border: 1px solid #1e293b; text-align: right; color: #34d399; font-size: 14px;">₹${totals.total.toLocaleString('mr-IN')}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Verification Statement -->
      <div style="background-color: #f8fafc; border: 1px border-dashed #cbd5e1; border-radius: 12px; padding: 12px 16px; margin-bottom: 32px; font-size: 11px; color: #475569; line-height: 1.5;">
        <strong>प्रमाणपत्र:</strong> प्रमाणित करण्यात येते की ${formattedDate} रोजी आयोजित करण्यात आलेल्या सभेमध्ये वरील सर्व तपशील, बचत जमा व कर्जाचे व्यवहार सर्व सदस्यांच्या हजेरीत बहुमताने संमत करण्यात आले आहेत.
      </div>

      <!-- Signatures and Official Stamp -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 16px;">
        <div style="text-align: center; width: 180px;">
          <div style="border-bottom: 1.5px dashed #94a3b8; height: 36px; margin-bottom: 6px;"></div>
          <div style="font-size: 12px; font-weight: 800; color: #1e293b;">सौ. रुख्मणबाई बोडखे</div>
          <div style="font-size: 11px; font-weight: 700; color: #059669;">(अध्यक्षा)</div>
        </div>

        <div style="text-align: center; width: 160px;">
          <div style="width: 100px; height: 100px; border: 2px dashed #059669; border-radius: 50%; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #047857; font-size: 10px; font-weight: 800; background-color: #f0fdf4;">
            <span>तुळजाभवानी</span>
            <span style="font-size: 8px;">बचत गट</span>
            <span style="font-size: 7px; margin-top: 2px;">अधिकृत शिक्का</span>
          </div>
        </div>

        <div style="text-align: center; width: 180px;">
          <div style="border-bottom: 1.5px dashed #94a3b8; height: 36px; margin-bottom: 6px;"></div>
          <div style="font-size: 12px; font-weight: 800; color: #1e293b;">सौ. लीलाबाई तुपे</div>
          <div style="font-size: 11px; font-weight: 700; color: #2563eb;">(सचिव)</div>
        </div>
      </div>

      <!-- Footer Note -->
      <div style="margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 8px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
        <span>संगणकीय प्रणालीद्वारे तयार केलेला अधिकृत अहवाल</span>
        <span>तारीख: ${new Date().toLocaleDateString('mr-IN')}</span>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, getHtml2CanvasConfig());

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
    pdf.save(`मासिक_सभा_अहवाल_${date}.pdf`);
  } catch (error) {
    console.error('Marathi PDF Generation Error:', error);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generates a clean Marathi Members List PDF
 */
export async function generateMembersPDF({
  members,
  gatName = 'तुळजाभवानी महिला बचत गट'
}: GenerateMembersPDFOptions): Promise<void> {
  const container = document.createElement('div');
  container.setAttribute('data-pdf-container', 'true');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = "'Noto Sans Devanagari', sans-serif";
  container.style.color = '#1c1917';
  container.style.padding = '32px';

  const totalMonthlySaving = members.reduce((acc, m) => acc + (Number(m.monthlySaving) || 0), 0);

  container.innerHTML = `
    <div style="background-color: #ffffff;">
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px; border-radius: 16px; color: #ffffff; text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 900;">${gatName}</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #ecfdf5;">अधिकृत सदस्य यादी व मासिक बचत पत्रक</p>
      </div>

      <!-- Quick Stats -->
      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        <div style="flex: 1; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 12px; text-align: center;">
          <div style="font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase;">एकूण नोंदणीकृत सदस्य</div>
          <div style="font-size: 20px; font-weight: 900; color: #065f46;">${members.length} जण</div>
        </div>
        <div style="flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 12px; text-align: center;">
          <div style="font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase;">दरमहा एकूण बचत जमा</div>
          <div style="font-size: 20px; font-weight: 900; color: #166534;">₹${totalMonthlySaving.toLocaleString('mr-IN')}</div>
        </div>
      </div>

      <!-- Members Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 13px;">
        <thead>
          <tr style="background-color: #047857; color: #ffffff;">
            <th style="padding: 10px; border: 1px solid #047857; text-align: center; width: 50px;">अ.क्र.</th>
            <th style="padding: 10px; border: 1px solid #047857; text-align: left;">सदस्याचे नाव</th>
            <th style="padding: 10px; border: 1px solid #047857; text-align: center; width: 120px;">गटातील पद</th>
            <th style="padding: 10px; border: 1px solid #047857; text-align: right; width: 140px;">मासिक बचत (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${members.map((m, i) => `
            <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${i + 1}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 800; color: #1e293b;">${m.name}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; ${
                  m.role === 'अध्यक्षा' ? 'background-color: #ffedd5; color: #c2410c;' :
                  m.role === 'सचिव' ? 'background-color: #dbeafe; color: #1d4ed8;' : 'background-color: #d1fae5; color: #065f46;'
                }">
                  ${m.role}
                </span>
              </td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 900; color: #059669;">₹${m.monthlySaving}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Signatures -->
      <div style="display: flex; justify-content: space-between; margin-top: 48px;">
        <div style="text-align: center; width: 180px;">
          <div style="border-bottom: 1.5px dashed #94a3b8; height: 36px; margin-bottom: 6px;"></div>
          <div style="font-size: 12px; font-weight: 800;">सौ. रुख्मणबाई बोडखे (अध्यक्षा)</div>
        </div>
        <div style="text-align: center; width: 180px;">
          <div style="border-bottom: 1.5px dashed #94a3b8; height: 36px; margin-bottom: 6px;"></div>
          <div style="font-size: 12px; font-weight: 800;">सौ. लीलाबाई तुपे (सचिव)</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, getHtml2CanvasConfig());

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save(`सदस्य_यादी_${gatName}.pdf`);
  } catch (error) {
    console.error('Marathi Members PDF Error:', error);
  } finally {
    document.body.removeChild(container);
  }
}

interface GenerateFinancialReportPDFOptions {
  meetings: Array<{ date: string; total: number; memberCount: number }>;
  gatName?: string;
}

/**
 * Generates a Marathi Financial Analysis & History PDF Report
 */
export async function generateFinancialReportPDF({
  meetings,
  gatName = 'तुळजाभवानी महिला बचत गट'
}: GenerateFinancialReportPDFOptions): Promise<void> {
  const container = document.createElement('div');
  container.setAttribute('data-pdf-container', 'true');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = "'Noto Sans Devanagari', sans-serif";
  container.style.color = '#1c1917';
  container.style.padding = '32px';

  const totalCollected = meetings.reduce((acc, m) => acc + (m.total || 0), 0);
  const avgMembers = meetings.length ? Math.round(meetings.reduce((acc, m) => acc + (m.memberCount || 0), 0) / meetings.length) : 0;

  container.innerHTML = `
    <div style="background-color: #ffffff;">
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px; border-radius: 16px; color: #ffffff; text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 900;">${gatName}</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #ecfdf5;">वार्षिक व मासिक आर्थिक विश्लेषण अहवाल</p>
      </div>

      <!-- Overview Stats -->
      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        <div style="flex: 1; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 14px; border-radius: 12px; text-align: center;">
          <div style="font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase;">एकूण जमा रक्कम</div>
          <div style="font-size: 22px; font-weight: 900; color: #065f46;">₹${totalCollected.toLocaleString('mr-IN')}</div>
        </div>
        <div style="flex: 1; background-color: #eff6ff; border: 1px solid #dbeafe; padding: 14px; border-radius: 12px; text-align: center;">
          <div style="font-size: 11px; font-weight: 800; color: #1d4ed8; text-transform: uppercase;">नोंदणीकृत सभा</div>
          <div style="font-size: 22px; font-weight: 900; color: #1e40af;">${meetings.length} सभेची नोंद</div>
        </div>
        <div style="flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 12px; text-align: center;">
          <div style="font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase;">सरासरी उपस्थिती</div>
          <div style="font-size: 22px; font-weight: 900; color: #166534;">${avgMembers} सदस्य</div>
        </div>
      </div>

      <!-- History Table -->
      <h3 style="font-size: 16px; font-weight: 900; color: #1e293b; margin-bottom: 12px;">महिन्यानिहाय हिशोब माहिती:</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 13px;">
        <thead>
          <tr style="background-color: #047857; color: #ffffff;">
            <th style="padding: 10px; border: 1px solid #047857; text-align: center; width: 50px;">अ.क्र.</th>
            <th style="padding: 10px; border: 1px solid #047857; text-align: left;">सभेची तारीख</th>
            <th style="padding: 10px; border: 1px solid #047857; text-align: center;">एकूण उपस्थिती</th>
            <th style="padding: 10px; border: 1px solid #047857; text-align: right;">एकूण जमा (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${meetings.map((m, i) => `
            <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${i + 1}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 800; color: #1e293b;">
                ${new Date(m.date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #2563eb;">${m.memberCount} सदस्य</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 900; color: #059669;">₹${(m.total || 0).toLocaleString('mr-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #1e293b; color: #ffffff; font-weight: 900;">
            <td colSpan="3" style="padding: 12px; text-align: right;">सर्व सभेतील एकूण जमा:</td>
            <td style="padding: 12px; text-align: right; color: #34d399; font-size: 15px;">₹${totalCollected.toLocaleString('mr-IN')}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Signatures -->
      <div style="display: flex; justify-content: space-between; margin-top: 48px;">
        <div style="text-align: center; width: 180px;">
          <div style="border-bottom: 1.5px dashed #94a3b8; height: 36px; margin-bottom: 6px;"></div>
          <div style="font-size: 12px; font-weight: 800;">सौ. रुख्मणबाई बोडखे (अध्यक्षा)</div>
        </div>
        <div style="text-align: center; width: 180px;">
          <div style="border-bottom: 1.5px dashed #94a3b8; height: 36px; margin-bottom: 6px;"></div>
          <div style="font-size: 12px; font-weight: 800;">सौ. लीलाबाई तुपे (सचिव)</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, getHtml2CanvasConfig());

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save(`आर्थिक_अहवाल_${gatName}.pdf`);
  } catch (error) {
    console.error('Marathi Financial PDF Error:', error);
  } finally {
    document.body.removeChild(container);
  }
}

